import { createStore, select, withProps } from '@ngneat/elf';
import {
  persistState
} from '@ngneat/elf-persist-state';
import { localForageStore } from '@ul/shared';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const STORE_NAME = 'schedule';

export interface ScheduleProps {
  schedule: Schedule;
  activePlanningIds: string[];
  hiddenCourseList: HiddenCourse[];
};

export interface Schedule {
  messages: [Message?];
  plannings?: Planning[];
};

export interface Message {
  level: string;
  code: string;
  text: string;
};

export interface Planning {
  id: string;
  // @TODO code: a retirer une fois l'api en place
  code: string;
  label: string;
  default: boolean;
  type: string;
  messages: [
    {
      level: string;
      text: string;
    }
  ] | [];
  events?: Event[];
  isSelected: boolean;
};

export interface Event {
  id: string;
  // @TODO _adeEventId: a retirer une fois l'api en place
  _adeEventId: number;
  startDateTime: string;
  endDateTime: string;
  course: Course,
  rooms: [
    {
      id: string;
      label: string;
      type: string;
    }
  ];
  teachers: [
    {
      id: string;
      firstname: string;
      lastname: string;
      email: string;
      name: string; // @TODO supprimer cette ligne une fois la nouvelle API en place
    }
  ];
  groups: [
    {
      id: string;
      label: string;
    }
  ];
};

export interface Course {
  // @TODO code: a retirer une fois l'api en place
  code: string;
  id: string;
  label: string;
  color: string;
  type: string;
  online: boolean;
  url?: string;
};

export interface HiddenCourse {
  id: string;
  title: string;
}

const filterDefaultPlanning = (planning: Planning): boolean => planning.default === true;
const mapPlanningId = (planning: Planning): string =>
  planning.id || (planning as any).code; // @TODO supprimer .code une fois la nouvelle API en place

export interface SelectedPlanningProps {
  selectedPlanning: string[];
};

export const scheduleStore = createStore(
  { name: STORE_NAME },
  withProps<ScheduleProps>({
    schedule: null,
    activePlanningIds: [],
    hiddenCourseList: []
  })
);

export const persist = persistState(scheduleStore, {
  key: STORE_NAME,
  storage: localForageStore,
});

export const schedule$ = scheduleStore.pipe(select((state) => state.schedule));

export const setSchedule = (schedule: ScheduleProps['schedule']) => {
  scheduleStore.update((state) => {

    const activePlanningIdsInSchedule = schedule.plannings
      .map(mapPlanningId)
      .filter(planningId => state.activePlanningIds.includes(planningId));
    const noActivePlanningIds = state.activePlanningIds.length === 0;
    const noActivePlanningIdsInSchedule = activePlanningIdsInSchedule.length === 0;
    const applyDefaultPlanning = noActivePlanningIds || noActivePlanningIdsInSchedule;

    const activePlanningIds = (applyDefaultPlanning) ?
      schedule.plannings
        .filter(filterDefaultPlanning)
        .map(mapPlanningId) :
      activePlanningIdsInSchedule;

    return {
      ...state,
      schedule,
      activePlanningIds
    };
  });
};

export const activePlanningIds$ = scheduleStore.pipe(select((state) => state.activePlanningIds));

export const setActivePlanningIds = (activePlanningIds: ScheduleProps['activePlanningIds']) => {
  scheduleStore.update((state) => ({
    ...state,
    activePlanningIds,
  }));
};

export const eventsFromActivePlannings$ : Observable<Event[]> = scheduleStore.pipe(select((state) => {
  let eventIds = [];
  return state.schedule?.plannings?.filter(planning => state.activePlanningIds.includes(mapPlanningId(planning)))
    .reduce((events, planning) => {
      planning.events.forEach(event => {
        // @TODO supprimer la ligne suivante quand l'API de l'UL sera prête.
        event.id = event._adeEventId.toString()
        if (!eventIds.includes(event.id)) {
          eventIds.push(event.id)
          events.push(event)
        }
      })
      return events
    }, [])
    .sort((a: Event, b: Event) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()) || []
}));

export const hiddenCourseList$ : Observable<HiddenCourse[]> = scheduleStore.pipe(select((state) => state.hiddenCourseList));

export const displayedEvents$ : Observable<Event[]> = combineLatest([eventsFromActivePlannings$, hiddenCourseList$]).pipe(
  map(([storedEvents, hiddenCourseList]) => {
    console.log(hiddenCourseList);
    console.log(storedEvents);
    return storedEvents.filter(event => {
      // @TODO supprimer la ligne suivante quand l'API de l'UL sera prête.
      event.course.id = event.course.code;

      return !hiddenCourseList.some(hiddenCourse => hiddenCourse.id === event.course.id);
    });;
  }));

export const setHiddenCourseList = (hiddenCourseList: ScheduleProps['hiddenCourseList']) => {
  scheduleStore.update((state) => ({
    ...state,
    hiddenCourseList: hiddenCourseList,
  }));
};
