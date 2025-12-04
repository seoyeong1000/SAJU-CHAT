"use client";

import { useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AlertCircle, Loader2, Search } from "lucide-react";

type CalendarType = "solar" | "lunar" | "lunar-leap";

type FormState = {
  name: string;
  gender: "male" | "female";
  birthDate: string;
  birthTime: string;
  timeUnknown: boolean;
  calendarType: CalendarType;
  tzid: string;
  locationText: string;
  locationUnknown: boolean;
  lat: string;
  lon: string;
  useTrueSolarTime: boolean;
  zishiSplit: "traditional" | "modern";
  fallbackStrategy: "allowApprox" | "strict";
};

type BaziResponse = {
  hourPillar: string | null;
  dayPillar: string | null;
  monthPillar: string | null;
  yearPillar: string | null;
  flags?: {
    usedTrueSolarTime: boolean;
    usedFallbackEngine: boolean;
    hourUnknown: boolean;
    locationUnknown: boolean;
  };
  meta?: {
    note?: string;
  };
};

const presets: Record<"ipchun" | "seoul" | "busan" | "unknown", Partial<FormState>> = {
  ipchun: {
    birthDate: "2024-02-04",
    birthTime: "16:28:00",
    gender: "female",
    lat: "37.5665",
    lon: "126.9780",
    tzid: "Asia/Seoul",
    timeUnknown: false,
    locationUnknown: false,
  },
  seoul: {
    birthDate: new Date().toISOString().split("T")[0],
    birthTime: "12:00:00",
    gender: "female",
    lat: "37.5665",
    lon: "126.9780",
    tzid: "Asia/Seoul",
    timeUnknown: false,
    locationUnknown: false,
  },
  busan: {
    birthDate: new Date().toISOString().split("T")[0],
    birthTime: "12:00:00",
    gender: "male",
    lat: "35.1796",
    lon: "129.0756",
    tzid: "Asia/Seoul",
    timeUnknown: false,
    locationUnknown: false,
  },
  unknown: {
    birthDate: "1990-01-01",
    birthTime: "",
    gender: "female",
    lat: "",
    lon: "",
    tzid: "Asia/Seoul",
    timeUnknown: true,
    locationUnknown: true,
  },
};

const cityOptions = [
  // 대한민국 주요 도시
  { label: "서울특별시, 대한민국", lat: "37.5665", lon: "126.9780", tzid: "Asia/Seoul" },
  { label: "부산광역시, 대한민국", lat: "35.1796", lon: "129.0756", tzid: "Asia/Seoul" },
  { label: "대구광역시, 대한민국", lat: "35.8714", lon: "128.6014", tzid: "Asia/Seoul" },
  { label: "인천광역시, 대한민국", lat: "37.4563", lon: "126.7052", tzid: "Asia/Seoul" },
  { label: "광주광역시, 대한민국", lat: "35.1595", lon: "126.8526", tzid: "Asia/Seoul" },
  { label: "대전광역시, 대한민국", lat: "36.3504", lon: "127.3845", tzid: "Asia/Seoul" },
  { label: "울산광역시, 대한민국", lat: "35.5384", lon: "129.3114", tzid: "Asia/Seoul" },
  { label: "세종특별자치시, 대한민국", lat: "36.48", lon: "127.289", tzid: "Asia/Seoul" },
  { label: "수원시, 대한민국", lat: "37.2636", lon: "127.0286", tzid: "Asia/Seoul" },
  { label: "성남시, 대한민국", lat: "37.42", lon: "127.1265", tzid: "Asia/Seoul" },
  { label: "고양시, 대한민국", lat: "37.6584", lon: "126.832", tzid: "Asia/Seoul" },
  { label: "용인시, 대한민국", lat: "37.2411", lon: "127.1775", tzid: "Asia/Seoul" },
  { label: "창원시, 대한민국", lat: "35.228", lon: "128.6812", tzid: "Asia/Seoul" },
  { label: "청주시, 대한민국", lat: "36.6424", lon: "127.489", tzid: "Asia/Seoul" },
  { label: "전주시, 대한민국", lat: "35.8242", lon: "127.148", tzid: "Asia/Seoul" },
  { label: "제주시, 대한민국", lat: "33.4996", lon: "126.5312", tzid: "Asia/Seoul" },
  { label: "포항시, 대한민국", lat: "36.019", lon: "129.3435", tzid: "Asia/Seoul" },
  { label: "김해시, 대한민국", lat: "35.2285", lon: "128.889", tzid: "Asia/Seoul" },
  { label: "남양주시, 대한민국", lat: "37.6542", lon: "127.308", tzid: "Asia/Seoul" },
  { label: "안산시, 대한민국", lat: "37.3219", lon: "126.8309", tzid: "Asia/Seoul" },
  { label: "안양시, 대한민국", lat: "37.3943", lon: "126.9568", tzid: "Asia/Seoul" },
  { label: "수영구, 부산, 대한민국", lat: "35.1644", lon: "129.114", tzid: "Asia/Seoul" },
  { label: "성동구, 서울, 대한민국", lat: "37.5634", lon: "127.0364", tzid: "Asia/Seoul" },
  { label: "동대문구, 서울, 대한민국", lat: "37.5744", lon: "127.0396", tzid: "Asia/Seoul" },

  // 해외 주요 도시
  { label: "도쿄, 일본", lat: "35.6895", lon: "139.6917", tzid: "Asia/Tokyo" },
  { label: "오사카, 일본", lat: "34.6937", lon: "135.5023", tzid: "Asia/Tokyo" },
  { label: "뉴욕, 미국", lat: "40.7128", lon: "-74.0060", tzid: "America/New_York" },
  { label: "로스앤젤레스, 미국", lat: "34.0522", lon: "-118.2437", tzid: "America/Los_Angeles" },
  { label: "런던, 영국", lat: "51.5074", lon: "-0.1278", tzid: "Europe/London" },
  { label: "파리, 프랑스", lat: "48.8566", lon: "2.3522", tzid: "Europe/Paris" },
  { label: "베를린, 독일", lat: "52.5200", lon: "13.4050", tzid: "Europe/Berlin" },
  { label: "시드니, 호주", lat: "-33.8688", lon: "151.2093", tzid: "Australia/Sydney" },
  { label: "상하이, 중국", lat: "31.2304", lon: "121.4737", tzid: "Asia/Shanghai" },
  { label: "베이징, 중국", lat: "39.9042", lon: "116.4074", tzid: "Asia/Shanghai" },
];

const DEFAULT_FORM: FormState = {
  name: "",
  gender: "female",
  birthDate: new Date().toISOString().split("T")[0],
  birthTime: "08:00",
  timeUnknown: false,
  calendarType: "solar",
  tzid: "Asia/Seoul",
  locationText: "",
  locationUnknown: false,
  lat: "37.5665",
  lon: "126.9780",
  useTrueSolarTime: true,
  zishiSplit: "traditional",
  fallbackStrategy: "allowApprox",
};

const BaziTestPage = () => {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<BaziResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showZishiGuide, setShowZishiGuide] = useState(false);
  const [showYajasiGuide, setShowYajasiGuide] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);

  const onChange = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildLocalWallTime = () => {
    if (!form.birthDate) return null;
    const rawTime =
      !form.timeUnknown && form.birthTime && form.birthTime.trim().length > 0
        ? form.birthTime
        : "00:00";
    const normalizedTime = rawTime.length === 5 ? `${rawTime}:00` : rawTime;
    return `${form.birthDate}T${normalizedTime}`;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const localWallTime = buildLocalWallTime();
      if (!localWallTime) {
        throw new Error("생년월일을 입력해주세요.");
      }

      const parsedLon = Number.parseFloat(form.lon);
      const parsedLat = Number.parseFloat(form.lat);
      const hasCoords =
        !form.locationUnknown &&
        form.locationText.trim() !== "" &&
        form.lat.trim() !== "" &&
        form.lon.trim() !== "" &&
        Number.isFinite(parsedLon) &&
        Number.isFinite(parsedLat);

      const body = {
        localWallTime,
        tzid: form.tzid || "Asia/Seoul",
        lon: hasCoords ? parsedLon : undefined,
        lat: hasCoords ? parsedLat : undefined,
        options: {
          useTrueSolarTime: hasCoords && form.useTrueSolarTime,
          zishiSplit: form.zishiSplit,
          fallbackStrategy: form.fallbackStrategy,
        },
      };

      const res = await fetch("/api/bazi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        let message = `HTTP ${res.status}`;
        try {
          const detail = JSON.parse(text);
          if (detail?.error) {
            message = detail.error;
          } else if (detail?.issues) {
            message = "입력값을 다시 확인해주세요.";
          }
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(message);
      }

      const data = (await res.json()) as BaziResponse;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreset = (key: keyof typeof presets) => {
    setForm((prev) => ({ ...prev, ...presets[key] }));
    setResult(null);
    setError(null);
  };

  const filteredCities = useMemo(() => {
    const q = form.locationText.trim().toLowerCase();
    if (!q) return cityOptions;
    return cityOptions.filter((c) => c.label.toLowerCase().includes(q));
  }, [form.locationText]);

  const selectCity = (city: (typeof cityOptions)[number]) => {
    setForm((prev) => ({
      ...prev,
      locationText: city.label,
      lat: city.lat,
      lon: city.lon,
      tzid: city.tzid,
      locationUnknown: false,
    }));
    setShowCityDropdown(false);
    setShowCityModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2f3ff] via-white to-[#fdf7ff]">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap");
        * {
          font-family: "Gowun Dodum", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-weight: 600;
        }
      `}</style>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="text-sm tracking-wide text-violet-500">ForceTeller Inspired</p>
          <h1 className="mb-3 text-4xl font-bold text-slate-800">만세력 입력</h1>
          <p className="text-slate-500">정확한 정보를 입력하고 세련된 사주 결과를 확인하세요.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border-0 bg-white/80 shadow-xl shadow-violet-100">
            <CardHeader>
              <CardTitle className="text-slate-800">프로필 입력</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700">
                  이름
                </Label>
                <Input
                  id="name"
                  placeholder="최대 12글자 이내로 입력하세요"
                  maxLength={12}
                  value={form.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  className="h-12 rounded-xl border-slate-200 bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">성별</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["female", "male"] as const).map((g) => (
                    <Button
                      key={g}
                      type="button"
                      variant={form.gender === g ? "default" : "outline"}
                      className={cn(
                        "h-11 w-full rounded-full border-slate-200 text-base",
                        form.gender === g
                          ? "bg-violet-600 text-white hover:bg-violet-700"
                          : "bg-white text-slate-700 hover:border-violet-200",
                      )}
                      onClick={() => onChange("gender", g)}
                    >
                      {g === "female" ? "여자" : "남자"}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700">생년월일시</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowZishiGuide(true)}
                    className="text-violet-600"
                  >
                    12간지 시간표
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Select
                    value={form.calendarType}
                    onValueChange={(v) => onChange("calendarType", v as CalendarType)}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                      <SelectValue placeholder="달력" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solar">양력</SelectItem>
                      <SelectItem value="lunar">음력</SelectItem>
                      <SelectItem value="lunar-leap">음력(윤달)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    className="col-span-2 h-11 rounded-xl border-slate-200 bg-white"
                    value={form.birthDate}
                    onChange={(e) => onChange("birthDate", e.target.value)}
                  />
                </div>
                <Input
                  type="time"
                  step={60}
                  className="h-11 rounded-xl border-slate-200 bg-white"
                  value={form.birthTime}
                  onChange={(e) => onChange("birthTime", e.target.value)}
                  disabled={form.timeUnknown}
                />
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="unknown-time"
                      checked={form.timeUnknown}
                      onCheckedChange={(v) => onChange("timeUnknown", Boolean(v))}
                    />
                    <Label
                      htmlFor="unknown-time"
                      className="cursor-pointer text-sm font-semibold text-slate-700"
                    >
                      시간 모름
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowYajasiGuide(true)}
                    className="px-2 text-violet-600"
                  >
                    야자시/조자시 안내
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">도시</Label>
                <div className="relative">
                  <Input
                    placeholder="서울특별시, 대한민국"
                    value={form.locationText}
                    onChange={(e) => onChange("locationText", e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white pr-10"
                    onFocus={() => setShowCityDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCityDropdown(false), 120)}
                    onClick={() => setShowCityModal(true)}
                  />
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  {showCityDropdown && filteredCities.length > 0 && (
                    <div className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                      {filteredCities.slice(0, 5).map((city) => (
                        <button
                          type="button"
                          key={city.label}
                          className="flex w-full items-start px-3 py-2 text-left text-sm text-slate-700 hover:bg-violet-50"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectCity(city)}
                        >
                          <div>
                            <div className="font-medium">{city.label}</div>
                            <div className="text-xs text-slate-400">
                              위도 {city.lat}, 경도 {city.lon} · {city.tzid}
                            </div>
                          </div>
                        </button>
                      ))}
                      {filteredCities.length > 5 && (
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-xs text-violet-700 hover:bg-violet-50"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setShowCityModal(true)}
                        >
                          더 보기 (+{filteredCities.length - 5})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 세부 설정과 빠른 테스트 섹션 제거됨 */}

              {error && (
                <Alert variant="destructive" className="border-rose-200 bg-rose-50 text-rose-700">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>계산 실패</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Button
                  className="h-14 w-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600 text-lg text-white shadow-lg shadow-violet-200 hover:from-violet-600 hover:to-violet-700"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      계산 중...
                    </>
                  ) : (
                    "만세력 보러가기"
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-full border-slate-200 text-slate-700 hover:border-violet-200"
                  onClick={() => loadPreset("unknown")}
                >
                  저장된 만세력 불러오기
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="border-0 bg-white/80 shadow-xl shadow-violet-100">
              <CardHeader>
                <CardTitle className="text-slate-800">사주 결과</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-3 rounded-2xl bg-gradient-to-br from-violet-50 to-white p-4 text-center">
                  <PillarBlock label="時柱" value={result?.hourPillar} />
                  <PillarBlock label="日柱" value={result?.dayPillar} />
                  <PillarBlock label="月柱" value={result?.monthPillar} />
                  <PillarBlock label="年柱" value={result?.yearPillar} />
                </div>
                {result?.flags && (
                  <div className="flex flex-wrap gap-2">
                    {result.flags.usedTrueSolarTime && (
                      <Badge className="bg-violet-100 text-violet-800">진태양시 적용</Badge>
                    )}
                    {result.flags.usedFallbackEngine && (
                      <Badge className="bg-amber-100 text-amber-800">근사 엔진 사용</Badge>
                    )}
                    {result.flags.hourUnknown && (
                      <Badge variant="outline" className="border-slate-300 text-slate-600">
                        생시 미상
                      </Badge>
                    )}
                    {result.flags.locationUnknown && (
                      <Badge variant="outline" className="border-slate-300 text-slate-600">
                        장소 미상
                      </Badge>
                    )}
                  </div>
                )}
                {result?.meta?.note && (
                  <p className="rounded-xl bg-violet-50 p-3 text-sm text-violet-800">{result.meta.note}</p>
                )}
                {!result && (
                  <p className="text-sm text-slate-500">
                    정보를 입력하고 &ldquo;만세력 보러가기&rdquo;를 누르면 사주가 표시됩니다.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showZishiGuide} onOpenChange={setShowZishiGuide}>
        <DialogContent className="max-w-md" aria-describedby="zishi-desc">
          <DialogHeader>
            <DialogTitle>12간지 시간표</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p id="zishi-desc" className="text-sm text-slate-600">
              경계 시간은 입력 시 유의해주세요. 예) 자시 → 01:20, 축시 → 03:00.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>간지</TableHead>
                  <TableHead>시간</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ["자시", "23:30(전날) ~ 01:30"],
                  ["축시", "01:30 ~ 03:30"],
                  ["인시", "03:30 ~ 05:30"],
                  ["묘시", "05:30 ~ 07:30"],
                  ["진시", "07:30 ~ 09:30"],
                  ["사시", "09:30 ~ 11:30"],
                  ["오시", "11:30 ~ 13:30"],
                  ["미시", "13:30 ~ 15:30"],
                  ["신시", "15:30 ~ 17:30"],
                  ["유시", "17:30 ~ 19:30"],
                  ["술시", "19:30 ~ 21:30"],
                  ["해시", "21:30 ~ 23:30"],
                ].map(([label, time]) => (
                  <TableRow key={label}>
                    <TableCell className="font-medium">{label}</TableCell>
                    <TableCell>{time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showYajasiGuide} onOpenChange={setShowYajasiGuide}>
        <DialogContent className="max-w-md" aria-describedby="yajasi-desc">
          <DialogHeader>
            <DialogTitle>야자시 / 조자시 안내</DialogTitle>
          </DialogHeader>
          <div id="yajasi-desc" className="space-y-2 text-sm text-slate-600">
            <p>
              modern 자시 정책: 23~24시는 당일, 00~01시는 다음 날 일주로 처리합니다. traditional은 23시부터
              다음 날로 넘어갑니다.
            </p>
            <p>시간/장소가 불확실하면 체크박스를 활용해 안전하게 입력하세요.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCityModal} onOpenChange={setShowCityModal}>
        <DialogContent className="max-w-3xl" aria-describedby="city-dialog-desc">
          <DialogHeader>
            <DialogTitle>도시 검색</DialogTitle>
          </DialogHeader>
          <p id="city-dialog-desc" className="text-sm text-slate-600">
            도시명을 입력하거나 목록에서 선택해주세요.
          </p>
          <div className="space-y-4">
            <Input
              autoFocus
              placeholder="도시명을 입력하세요 (예: 서울, 부산, 도쿄, New York)"
              value={form.locationText}
              onChange={(e) => onChange("locationText", e.target.value)}
              className="h-11"
            />
            <div className="max-h-96 overflow-auto rounded-xl border border-slate-200">
              {filteredCities.map((city) => (
                <button
                  key={city.label}
                  type="button"
                  className="flex w-full items-start px-4 py-3 text-left hover:bg-violet-50"
                  onClick={() => selectCity(city)}
                >
                  <div>
                    <div className="font-medium text-slate-800">{city.label}</div>
                    <div className="text-xs text-slate-500">
                      위도 {city.lat}, 경도 {city.lon} · {city.tzid}
                    </div>
                  </div>
                </button>
              ))}
              {filteredCities.length === 0 && (
                <p className="px-4 py-6 text-sm text-slate-500">검색 결과가 없습니다.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const PillarBlock = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="rounded-xl bg-white/80 px-3 py-2 shadow-sm shadow-violet-50">
    <div className="text-xs text-slate-400">{label}</div>
    <div className="text-3xl font-bold text-slate-800">{value ?? "?"}</div>
  </div>
);

export default BaziTestPage;
