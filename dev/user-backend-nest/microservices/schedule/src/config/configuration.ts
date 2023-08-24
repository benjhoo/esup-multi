import { KeepAliveOptions, UlApi } from './configuration.interface';

const applyIfNotBlank = (param: string, applyFn: (value: string) => void) => {
  if (param && param.trim().length > 0) {
    applyFn(param);
  }
};

export default (): {
  ulApi: UlApi;
  keepAliveOptions: KeepAliveOptions;
  cacheTtl: number;
} => {
  const keepAliveOptions = {};

  applyIfNotBlank(
    process.env.SCHEDULE_SERVICE_AGENTKEEPALIVE_OPTION_KEEPALIVE,
    (value) => (keepAliveOptions['keepAlive'] = value === 'true'),
  );

  applyIfNotBlank(
    process.env.SCHEDULE_SERVICE_AGENTKEEPALIVE_OPTION_KEEPALIVEMSECS,
    (value) => (keepAliveOptions['keepAliveMsecs'] = parseInt(value)),
  );

  applyIfNotBlank(
    process.env.SCHEDULE_SERVICE_AGENTKEEPALIVE_OPTION_FREESOCKETTIMEOUT,
    (value) => (keepAliveOptions['freeSocketTimeout'] = parseInt(value)),
  );

  applyIfNotBlank(
    process.env.SCHEDULE_SERVICE_AGENTKEEPALIVE_OPTION_TIMEOUT,
    (value) => (keepAliveOptions['timeout'] = parseInt(value)),
  );

  applyIfNotBlank(
    process.env.SCHEDULE_SERVICE_AGENTKEEPALIVE_OPTION_MAXSOCKETS,
    (value) => (keepAliveOptions['maxSockets'] = parseInt(value)),
  );

  applyIfNotBlank(
    process.env.SCHEDULE_SERVICE_AGENTKEEPALIVE_OPTION_MAXFREESOCKETS,
    (value) => (keepAliveOptions['maxFreeSockets'] = parseInt(value)),
  );

  applyIfNotBlank(
    process.env.SCHEDULE_SERVICE_AGENTKEEPALIVE_OPTION_SOCKETACTIVETTL,
    (value) => (keepAliveOptions['socketActiveTTL'] = parseInt(value)),
  );

  return {
    ulApi: {
      userScheduleUrl: process.env.SCHEDULE_SERVICE_UL_API_USER_SCHEDULE_URL,
      bearerToken: process.env.SCHEDULE_SERVICE_UL_API_BEARER_TOKEN,
      scheduleAdminRoles: process.env.SCHEDULE_SERVICE_ADMIN_ROLES
        ? process.env.SCHEDULE_SERVICE_ADMIN_ROLES.split(',')
        : [],
    },
    keepAliveOptions,
    cacheTtl: parseInt(process.env.SCHEDULE_SERVICE_CACHE_TTL_MS),
  };
};
