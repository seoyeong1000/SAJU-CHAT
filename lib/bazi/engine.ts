import path from "path";

type SwissEphCtor = typeof import("swisseph-wasm").default;
type SwissEphInstance = InstanceType<SwissEphCtor>;

type SwissEphWithPath = SwissEphInstance & {
  set_ephe_path: (ephePath: string) => string;
  calc_ut: (julianDay: number, body: number, flags: number) => Float64Array;
};

const EPHE_PATH = path.join(process.cwd(), "public", "ephe");

let initPromise: Promise<SwissEphWithPath> | null = null;
let ctorPromise: Promise<SwissEphCtor> | null = null;

const loadSwissEphCtor = async (): Promise<SwissEphCtor> => {
  if (!ctorPromise) {
    ctorPromise = import("swisseph-wasm").then((mod) => mod.default);
  }
  return ctorPromise;
};

const initSwissInstance = async (): Promise<SwissEphWithPath> => {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const SwissEph = await loadSwissEphCtor();
    const instance = new SwissEph() as SwissEphWithPath;
    await instance.initSwissEph();
    const normalizedEphePath = EPHE_PATH.replace(/\\/g, "/");
    instance.set_ephe_path(normalizedEphePath);
    return instance;
  })();

  return initPromise;
};

export const getSwissEph = async (): Promise<SwissEphWithPath> => {
  return initSwissInstance();
};

export const testSwissConnection = async (): Promise<number> => {
  const swe = await getSwissEph();
  const julianDay = swe.julday(1990, 1, 1, 0);
  const [sunLongitude] = swe.calc_ut(julianDay, swe.SE_SUN, swe.SEFLG_SWIEPH);
  console.log(
    `[swisseph] Sun longitude 1990-01-01 (UTC 00:00): ${sunLongitude.toFixed(
      6,
    )} deg`,
  );
  return sunLongitude;
};
