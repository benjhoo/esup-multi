import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { FeatureType } from '../features/features.repository';
import { FeaturesService, TranslatedExternalFeature, TranslatedFeature, TranslatedInternalFeature } from '../features/features.service';
import { ProjectModuleService } from '../project-module/project-module.service';
import { StaticMenuItem, StaticMenuType } from '../project-module/static-menu.service';
import { MenuItem, MenuItemLink, MenuItemLinkType, ServiceMenuItem } from './menu.model';

@Injectable({
    providedIn: 'root'
})
export class MenuService {
    public tabsMenuItems$ = new ReplaySubject<MenuItem[]>();
    public topMenuItems$ = new BehaviorSubject<MenuItem[]>([]);
    public burgerMenuItems$ = new BehaviorSubject<MenuItem[]>([]);
    public allMenuItems$ = new BehaviorSubject<MenuItem[]>([]);
    private allStaticMenuItems: MenuItem[];
    private tabsStaticMenuItemsStart: MenuItem[];
    private tabsStaticMenuItemsEnd: MenuItem[];
    private burgerStaticMenuItems: MenuItem[];

    constructor(
      private projectModuleService: ProjectModuleService,
      private featuresService: FeaturesService,
    ) {
      this.allStaticMenuItems = this.getStaticMenuItems();
      this.tabsStaticMenuItemsStart = this.getStaticMenuItemsByType('tabs:start');
      this.tabsStaticMenuItemsEnd = this.getStaticMenuItemsByType('tabs:end');
      this.burgerStaticMenuItems = this.getStaticMenuItemsByType('burger');

      // all menu items are a merge between static (from modules) and dynamic (from CMS) menu items
      this.featuresService.translatedFeatures$.pipe(
        map(features => features.filter(feature => feature.menu && !feature.widget)),
        map(features => features.map((app: TranslatedFeature) => this.convertTranslatedFeature(app))),
        map((dynamicMenuItems: MenuItem[]) => [
            ...this.allStaticMenuItems,
            ...dynamicMenuItems,
        ])
      ).subscribe(this.allMenuItems$);

      // burger menu items are a merge between static (from modules) and dynamic (from CMS) menu items
      this.featuresService.translatedFeatures$.pipe(
        map(features => features.filter(feature => feature.menu === 'burger' && !feature.widget)),
        map(features => features.map((app: TranslatedFeature) => this.convertTranslatedFeature(app))),
        map((dynamicMenuItems: MenuItem[]) => [
            ...this.burgerStaticMenuItems,
            ...dynamicMenuItems,
        ])
      ).subscribe(this.burgerMenuItems$);

      // tabs menu items are a merge between static (from modules) and dynamic (from CMS) menu items
      this.featuresService.translatedFeatures$.pipe(
        map(features => features.filter(feature => feature.menu === 'tabs' && !feature.widget)),
        map(features => features.map((app: TranslatedFeature) => this.convertTranslatedFeature(app))),
        map((dynamicMenuItems: MenuItem[]) => [
          ...this.tabsStaticMenuItemsStart,
          ...dynamicMenuItems,
          ...this.tabsStaticMenuItemsEnd,
        ])
      ).subscribe(this.tabsMenuItems$);

      // top menu items are fully dynamic (from CMS)
      this.featuresService.translatedFeatures$.pipe(
        map(features => features.filter(feature => feature.menu === 'top' && !feature.widget)),
        map(features => features.map((app: TranslatedFeature) => this.convertTranslatedFeature(app)))
      ).subscribe(this.topMenuItems$);
    }

    public convertTranslatedFeature(feature: TranslatedFeature): ServiceMenuItem {
      switch(feature.type) {
        case FeatureType.internal:
          return this.convertTranslatedInternalFeature(feature);
        case FeatureType.external:
          return this.convertTranslatedExternalFeature(feature);
      }
    }

    private getStaticMenuItemsByType(menuType: StaticMenuType): MenuItem[] {
        return this.projectModuleService.getStaticMenuItemsByType(menuType)
        .map(menuItem => this.convertStaticMenuItem(menuItem));
    }

    private getStaticMenuItems(): MenuItem[] {
      return this.projectModuleService.getStaticMenuItems()
            .map(menuItem => this.convertStaticMenuItem(menuItem));
    }

    private convertStaticMenuItem(staticMenuItem: StaticMenuItem): MenuItem {
      return {
        icon: staticMenuItem.icon,
        title: staticMenuItem.title,
        shortTitle: staticMenuItem.shortTitle,
        link: {
            type: MenuItemLinkType.router,
            routerLink: staticMenuItem.routerLink
        },
        type: 'static'
      };
    }

    private convertTranslatedInternalFeature(app: TranslatedInternalFeature): ServiceMenuItem {
      return {
        ...app,
        icon: app.icon,
        iconSourceSvgLightTheme: app.iconSourceSvgLightTheme,
        iconSourceSvgDarkTheme: app.iconSourceSvgDarkTheme,
        title: app.title,
        shortTitle: app.shortTitle,
        link: {
          type: MenuItemLinkType.router,
          routerLink: app.routerLink
        },
        type: 'dynamic'
      };
    }


    private convertTranslatedExternalFeature(app: TranslatedExternalFeature): ServiceMenuItem {
      const link: MenuItemLink = (app.ssoService) ?
        {
          type: MenuItemLinkType.sso,
          urlTemplate: app.link,
          service: app.ssoService
        } :
        {
          type: MenuItemLinkType.external,
          url: app.link
        };

      return {
        ...app,
        icon: app.icon,
        iconSourceSvgLightTheme: app.iconSourceSvgLightTheme,
        iconSourceSvgDarkTheme: app.iconSourceSvgDarkTheme,
        title: app.title,
        shortTitle: app.shortTitle,
        link,
        type: 'dynamic',
      };
    }
}
