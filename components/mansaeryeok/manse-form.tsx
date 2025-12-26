'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useUser } from '@clerk/nextjs'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Search, ChevronDown, ChevronUp, MapPin, Info, FolderOpen, Calendar, ArrowRight } from 'lucide-react'

import { submitSajuForm } from '@/app/mansaeryeok/actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'

// 폼 스키마
const formSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요').max(20, '이름은 20자 이내로 입력하세요'),
  calendarType: z.enum(['solar', 'lunar', 'lunarLeap']).default('solar'),
  birthYear: z.string().min(4, '연도를 입력하세요'),
  birthMonth: z.string().min(1, '월을 선택하세요'),
  birthDay: z.string().min(1, '일을 선택하세요'),
  birthSijin: z.string().optional(),
  timeUnknown: z.boolean().default(false),
  jasiOption: z.enum(['none', 'yajasi', 'jojasi']).default('none'),
  gender: z.enum(['male', 'female']).optional(),
  birthCity: z.string().optional(),
})

// 달력 타입 옵션
const CALENDAR_TYPES = [
  { value: 'solar', label: '양력' },
  { value: 'lunar', label: '음력' },
  { value: 'lunarLeap', label: '음력(윤달)' },
] as const

type FormData = z.infer<typeof formSchema>

// 월 목록
const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: `${i + 1}월`,
}))

// 일 목록 (최대 31일)
const DAYS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: `${i + 1}일`,
}))

// 시진 목록 (12시진)
const SIJIN = [
  { value: '23:30', label: '자시 (子時) 23:00~01:00', isJasi: true },
  { value: '01:30', label: '축시 (丑時) 01:00~03:00', isJasi: false },
  { value: '03:30', label: '인시 (寅時) 03:00~05:00', isJasi: false },
  { value: '05:30', label: '묘시 (卯時) 05:00~07:00', isJasi: false },
  { value: '07:30', label: '진시 (辰時) 07:00~09:00', isJasi: false },
  { value: '09:30', label: '사시 (巳時) 09:00~11:00', isJasi: false },
  { value: '11:30', label: '오시 (午時) 11:00~13:00', isJasi: false },
  { value: '13:30', label: '미시 (未時) 13:00~15:00', isJasi: false },
  { value: '15:30', label: '신시 (申時) 15:00~17:00', isJasi: false },
  { value: '17:30', label: '유시 (酉時) 17:00~19:00', isJasi: false },
  { value: '19:30', label: '술시 (戌時) 19:00~21:00', isJasi: false },
  { value: '21:30', label: '해시 (亥時) 21:00~23:00', isJasi: false },
] as const

// 12간지 시간표 데이터
const SIJIN_TABLE = [
  { name: '자시', hanja: '子時', time: '23:00 ~ 01:00', element: '수(水)', animal: '쥐' },
  { name: '축시', hanja: '丑時', time: '01:00 ~ 03:00', element: '토(土)', animal: '소' },
  { name: '인시', hanja: '寅時', time: '03:00 ~ 05:00', element: '목(木)', animal: '호랑이' },
  { name: '묘시', hanja: '卯時', time: '05:00 ~ 07:00', element: '목(木)', animal: '토끼' },
  { name: '진시', hanja: '辰時', time: '07:00 ~ 09:00', element: '토(土)', animal: '용' },
  { name: '사시', hanja: '巳時', time: '09:00 ~ 11:00', element: '화(火)', animal: '뱀' },
  { name: '오시', hanja: '午時', time: '11:00 ~ 13:00', element: '화(火)', animal: '말' },
  { name: '미시', hanja: '未時', time: '13:00 ~ 15:00', element: '토(土)', animal: '양' },
  { name: '신시', hanja: '申時', time: '15:00 ~ 17:00', element: '금(金)', animal: '원숭이' },
  { name: '유시', hanja: '酉時', time: '17:00 ~ 19:00', element: '금(金)', animal: '닭' },
  { name: '술시', hanja: '戌時', time: '19:00 ~ 21:00', element: '토(土)', animal: '개' },
  { name: '해시', hanja: '亥時', time: '21:00 ~ 23:00', element: '수(水)', animal: '돼지' },
]

// 전세계 도시 목록 (한국 시/군 단위 포함)
const CITIES = [
  // ===== 대한민국 - 특별시/광역시 =====
  { value: 'kr-seoul', label: '서울특별시', country: '대한민국', timezone: 'Asia/Seoul', lat: 37.5665, lng: 126.9780 },
  { value: 'kr-busan', label: '부산광역시', country: '대한민국', timezone: 'Asia/Seoul', lat: 35.1796, lng: 129.0756 },
  { value: 'kr-incheon', label: '인천광역시', country: '대한민국', timezone: 'Asia/Seoul', lat: 37.4563, lng: 126.7052 },
  { value: 'kr-daegu', label: '대구광역시', country: '대한민국', timezone: 'Asia/Seoul', lat: 35.8714, lng: 128.6014 },
  { value: 'kr-daejeon', label: '대전광역시', country: '대한민국', timezone: 'Asia/Seoul', lat: 36.3504, lng: 127.3845 },
  { value: 'kr-gwangju', label: '광주광역시', country: '대한민국', timezone: 'Asia/Seoul', lat: 35.1595, lng: 126.8526 },
  { value: 'kr-ulsan', label: '울산광역시', country: '대한민국', timezone: 'Asia/Seoul', lat: 35.5384, lng: 129.3114 },
  { value: 'kr-sejong', label: '세종특별자치시', country: '대한민국', timezone: 'Asia/Seoul', lat: 36.4800, lng: 127.2890 },

  // ===== 경기도 =====
  { value: 'kr-suwon', label: '수원시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.2636, lng: 127.0286 },
  { value: 'kr-seongnam', label: '성남시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.4200, lng: 127.1265 },
  { value: 'kr-goyang', label: '고양시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.6584, lng: 126.8320 },
  { value: 'kr-yongin', label: '용인시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.2411, lng: 127.1775 },
  { value: 'kr-bucheon', label: '부천시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.5034, lng: 126.7660 },
  { value: 'kr-ansan', label: '안산시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.3219, lng: 126.8309 },
  { value: 'kr-anyang', label: '안양시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.3943, lng: 126.9568 },
  { value: 'kr-namyangju', label: '남양주시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.6360, lng: 127.2165 },
  { value: 'kr-hwaseong', label: '화성시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.1996, lng: 126.8312 },
  { value: 'kr-pyeongtaek', label: '평택시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 36.9921, lng: 127.1128 },
  { value: 'kr-uijeongbu', label: '의정부시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.7381, lng: 127.0337 },
  { value: 'kr-siheung', label: '시흥시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.3800, lng: 126.8028 },
  { value: 'kr-paju', label: '파주시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.7126, lng: 126.7610 },
  { value: 'kr-gimpo', label: '김포시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.6152, lng: 126.7156 },
  { value: 'kr-gwangmyeong', label: '광명시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.4786, lng: 126.8644 },
  { value: 'kr-gwangju-gg', label: '광주시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.4095, lng: 127.2550 },
  { value: 'kr-gunpo', label: '군포시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.3616, lng: 126.9351 },
  { value: 'kr-hanam', label: '하남시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.5393, lng: 127.2147 },
  { value: 'kr-osan', label: '오산시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.1499, lng: 127.0774 },
  { value: 'kr-icheon', label: '이천시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.2720, lng: 127.4351 },
  { value: 'kr-anseong', label: '안성시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.0080, lng: 127.2797 },
  { value: 'kr-uiwang', label: '의왕시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.3449, lng: 126.9683 },
  { value: 'kr-yangpyeong', label: '양평군', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.4917, lng: 127.4875 },
  { value: 'kr-yeoju', label: '여주시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.2983, lng: 127.6375 },
  { value: 'kr-pocheon', label: '포천시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.8949, lng: 127.2003 },
  { value: 'kr-yangju', label: '양주시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.7853, lng: 127.0458 },
  { value: 'kr-dongducheon', label: '동두천시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.9035, lng: 127.0606 },
  { value: 'kr-guri', label: '구리시', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.5943, lng: 127.1295 },
  { value: 'kr-gapyeong', label: '가평군', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 37.8315, lng: 127.5095 },
  { value: 'kr-yeoncheon', label: '연천군', country: '대한민국 경기도', timezone: 'Asia/Seoul', lat: 38.0965, lng: 127.0748 },

  // ===== 강원도 =====
  { value: 'kr-chuncheon', label: '춘천시', country: '대한민국 강원도', timezone: 'Asia/Seoul', lat: 37.8813, lng: 127.7300 },
  { value: 'kr-wonju', label: '원주시', country: '대한민국 강원도', timezone: 'Asia/Seoul', lat: 37.3422, lng: 127.9202 },
  { value: 'kr-gangneung', label: '강릉시', country: '대한민국 강원도', timezone: 'Asia/Seoul', lat: 37.7519, lng: 128.8761 },
  { value: 'kr-donghae', label: '동해시', country: '대한민국 강원도', timezone: 'Asia/Seoul', lat: 37.5247, lng: 129.1143 },
  { value: 'kr-taebaek', label: '태백시', country: '대한민국 강원도', timezone: 'Asia/Seoul', lat: 37.1640, lng: 128.9856 },
  { value: 'kr-sokcho', label: '속초시', country: '대한민국 강원도', timezone: 'Asia/Seoul', lat: 38.2070, lng: 128.5918 },
  { value: 'kr-samcheok', label: '삼척시', country: '대한민국 강원도', timezone: 'Asia/Seoul', lat: 37.4500, lng: 129.1651 },
  { value: 'kr-hongcheon', label: '홍천군', country: '대한민국 강원도', timezone: 'Asia/Seoul', lat: 37.6972, lng: 127.8886 },
  { value: 'kr-hoengseong', label: '횡성군', country: '대한민국 강원도', timezone: 'Asia/Seoul', lat: 37.4914, lng: 127.9847 },
  { value: 'kr-yeongwol', label: '영월군', country: '대한민국 강원도', timezone: 'Asia/Seoul', lat: 37.1837, lng: 128.4617 },
  { value: 'kr-pyeongchang', label: '평창군', country: '대한민국 강원도', timezone: 'Asia/Seoul', lat: 37.3705, lng: 128.3900 },
  { value: 'kr-jeongseon', label: '정선군', country: '대한민국 강원도', timezone: 'Asia/Seoul', lat: 37.3807, lng: 128.6608 },
  { value: 'kr-cheorwon', label: '철원군', country: '대한민국 강원도', timezone: 'Asia/Seoul', lat: 38.1467, lng: 127.3133 },
  { value: 'kr-hwacheon', label: '화천군', country: '대한민국 강원도', timezone: 'Asia/Seoul', lat: 38.1062, lng: 127.7081 },
  { value: 'kr-yanggu', label: '양구군', country: '대한민국 강원도', timezone: 'Asia/Seoul', lat: 38.1097, lng: 127.9897 },
  { value: 'kr-inje', label: '인제군', country: '대한민국 강원도', timezone: 'Asia/Seoul', lat: 38.0697, lng: 128.1706 },
  { value: 'kr-goseong-gw', label: '고성군', country: '대한민국 강원도', timezone: 'Asia/Seoul', lat: 38.3800, lng: 128.4678 },
  { value: 'kr-yangyang', label: '양양군', country: '대한민국 강원도', timezone: 'Asia/Seoul', lat: 38.0754, lng: 128.6189 },

  // ===== 충청북도 =====
  { value: 'kr-cheongju', label: '청주시', country: '대한민국 충청북도', timezone: 'Asia/Seoul', lat: 36.6424, lng: 127.4890 },
  { value: 'kr-chungju', label: '충주시', country: '대한민국 충청북도', timezone: 'Asia/Seoul', lat: 36.9910, lng: 127.9259 },
  { value: 'kr-jecheon', label: '제천시', country: '대한민국 충청북도', timezone: 'Asia/Seoul', lat: 37.1326, lng: 128.1910 },
  { value: 'kr-boeun', label: '보은군', country: '대한민국 충청북도', timezone: 'Asia/Seoul', lat: 36.4895, lng: 127.7294 },
  { value: 'kr-okcheon', label: '옥천군', country: '대한민국 충청북도', timezone: 'Asia/Seoul', lat: 36.3063, lng: 127.5712 },
  { value: 'kr-yeongdong', label: '영동군', country: '대한민국 충청북도', timezone: 'Asia/Seoul', lat: 36.1750, lng: 127.7764 },
  { value: 'kr-jeungpyeong', label: '증평군', country: '대한민국 충청북도', timezone: 'Asia/Seoul', lat: 36.7854, lng: 127.5815 },
  { value: 'kr-jincheon', label: '진천군', country: '대한민국 충청북도', timezone: 'Asia/Seoul', lat: 36.8553, lng: 127.4357 },
  { value: 'kr-goesan', label: '괴산군', country: '대한민국 충청북도', timezone: 'Asia/Seoul', lat: 36.8153, lng: 127.7868 },
  { value: 'kr-eumseong', label: '음성군', country: '대한민국 충청북도', timezone: 'Asia/Seoul', lat: 36.9400, lng: 127.6906 },
  { value: 'kr-danyang', label: '단양군', country: '대한민국 충청북도', timezone: 'Asia/Seoul', lat: 36.9845, lng: 128.3655 },

  // ===== 충청남도 =====
  { value: 'kr-cheonan', label: '천안시', country: '대한민국 충청남도', timezone: 'Asia/Seoul', lat: 36.8151, lng: 127.1139 },
  { value: 'kr-gongju', label: '공주시', country: '대한민국 충청남도', timezone: 'Asia/Seoul', lat: 36.4465, lng: 127.1190 },
  { value: 'kr-boryeong', label: '보령시', country: '대한민국 충청남도', timezone: 'Asia/Seoul', lat: 36.3334, lng: 126.6129 },
  { value: 'kr-asan', label: '아산시', country: '대한민국 충청남도', timezone: 'Asia/Seoul', lat: 36.7898, lng: 127.0018 },
  { value: 'kr-seosan', label: '서산시', country: '대한민국 충청남도', timezone: 'Asia/Seoul', lat: 36.7849, lng: 126.4503 },
  { value: 'kr-nonsan', label: '논산시', country: '대한민국 충청남도', timezone: 'Asia/Seoul', lat: 36.1872, lng: 127.0987 },
  { value: 'kr-gyeryong', label: '계룡시', country: '대한민국 충청남도', timezone: 'Asia/Seoul', lat: 36.2745, lng: 127.2486 },
  { value: 'kr-dangjin', label: '당진시', country: '대한민국 충청남도', timezone: 'Asia/Seoul', lat: 36.8945, lng: 126.6458 },
  { value: 'kr-geumsan', label: '금산군', country: '대한민국 충청남도', timezone: 'Asia/Seoul', lat: 36.1086, lng: 127.4880 },
  { value: 'kr-buyeo', label: '부여군', country: '대한민국 충청남도', timezone: 'Asia/Seoul', lat: 36.2758, lng: 126.9098 },
  { value: 'kr-seocheon', label: '서천군', country: '대한민국 충청남도', timezone: 'Asia/Seoul', lat: 36.0804, lng: 126.6914 },
  { value: 'kr-cheongyang', label: '청양군', country: '대한민국 충청남도', timezone: 'Asia/Seoul', lat: 36.4593, lng: 126.8022 },
  { value: 'kr-hongseong', label: '홍성군', country: '대한민국 충청남도', timezone: 'Asia/Seoul', lat: 36.6012, lng: 126.6608 },
  { value: 'kr-yesan', label: '예산군', country: '대한민국 충청남도', timezone: 'Asia/Seoul', lat: 36.6827, lng: 126.8478 },
  { value: 'kr-taean', label: '태안군', country: '대한민국 충청남도', timezone: 'Asia/Seoul', lat: 36.7456, lng: 126.2979 },

  // ===== 전라북도 =====
  { value: 'kr-jeonju', label: '전주시', country: '대한민국 전라북도', timezone: 'Asia/Seoul', lat: 35.8242, lng: 127.1480 },
  { value: 'kr-gunsan', label: '군산시', country: '대한민국 전라북도', timezone: 'Asia/Seoul', lat: 35.9676, lng: 126.7368 },
  { value: 'kr-iksan', label: '익산시', country: '대한민국 전라북도', timezone: 'Asia/Seoul', lat: 35.9483, lng: 126.9577 },
  { value: 'kr-jeongeup', label: '정읍시', country: '대한민국 전라북도', timezone: 'Asia/Seoul', lat: 35.5699, lng: 126.8560 },
  { value: 'kr-namwon', label: '남원시', country: '대한민국 전라북도', timezone: 'Asia/Seoul', lat: 35.4164, lng: 127.3903 },
  { value: 'kr-gimje', label: '김제시', country: '대한민국 전라북도', timezone: 'Asia/Seoul', lat: 35.8037, lng: 126.8808 },
  { value: 'kr-wanju', label: '완주군', country: '대한민국 전라북도', timezone: 'Asia/Seoul', lat: 35.9044, lng: 127.1617 },
  { value: 'kr-jinan', label: '진안군', country: '대한민국 전라북도', timezone: 'Asia/Seoul', lat: 35.7917, lng: 127.4248 },
  { value: 'kr-muju', label: '무주군', country: '대한민국 전라북도', timezone: 'Asia/Seoul', lat: 35.9922, lng: 127.6607 },
  { value: 'kr-jangsu', label: '장수군', country: '대한민국 전라북도', timezone: 'Asia/Seoul', lat: 35.6475, lng: 127.5213 },
  { value: 'kr-imsil', label: '임실군', country: '대한민국 전라북도', timezone: 'Asia/Seoul', lat: 35.6178, lng: 127.2890 },
  { value: 'kr-sunchang', label: '순창군', country: '대한민국 전라북도', timezone: 'Asia/Seoul', lat: 35.3745, lng: 127.1375 },
  { value: 'kr-gochang', label: '고창군', country: '대한민국 전라북도', timezone: 'Asia/Seoul', lat: 35.4358, lng: 126.7019 },
  { value: 'kr-buan', label: '부안군', country: '대한민국 전라북도', timezone: 'Asia/Seoul', lat: 35.7316, lng: 126.7331 },

  // ===== 전라남도 =====
  { value: 'kr-mokpo', label: '목포시', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 34.8118, lng: 126.3922 },
  { value: 'kr-yeosu', label: '여수시', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 34.7604, lng: 127.6622 },
  { value: 'kr-suncheon', label: '순천시', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 34.9506, lng: 127.4872 },
  { value: 'kr-naju', label: '나주시', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 35.0159, lng: 126.7109 },
  { value: 'kr-gwangyang', label: '광양시', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 34.9407, lng: 127.6959 },
  { value: 'kr-damyang', label: '담양군', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 35.3211, lng: 126.9882 },
  { value: 'kr-gokseong', label: '곡성군', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 35.2819, lng: 127.2918 },
  { value: 'kr-gurye', label: '구례군', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 35.2026, lng: 127.4627 },
  { value: 'kr-goheung', label: '고흥군', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 34.6049, lng: 127.2851 },
  { value: 'kr-boseong', label: '보성군', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 34.7714, lng: 127.0799 },
  { value: 'kr-hwasun', label: '화순군', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 35.0644, lng: 126.9867 },
  { value: 'kr-jangheung', label: '장흥군', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 34.6816, lng: 126.9071 },
  { value: 'kr-gangjin', label: '강진군', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 34.6419, lng: 126.7673 },
  { value: 'kr-haenam', label: '해남군', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 34.5736, lng: 126.5993 },
  { value: 'kr-yeongam', label: '영암군', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 34.8001, lng: 126.6967 },
  { value: 'kr-muan', label: '무안군', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 34.9904, lng: 126.4815 },
  { value: 'kr-hampyeong', label: '함평군', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 35.0659, lng: 126.5169 },
  { value: 'kr-yeonggwang', label: '영광군', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 35.2772, lng: 126.5120 },
  { value: 'kr-jangseong', label: '장성군', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 35.3018, lng: 126.7847 },
  { value: 'kr-wando', label: '완도군', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 34.3109, lng: 126.7549 },
  { value: 'kr-jindo', label: '진도군', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 34.4869, lng: 126.2636 },
  { value: 'kr-sinan', label: '신안군', country: '대한민국 전라남도', timezone: 'Asia/Seoul', lat: 34.8292, lng: 126.1072 },

  // ===== 경상북도 =====
  { value: 'kr-pohang', label: '포항시', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 36.0190, lng: 129.3435 },
  { value: 'kr-gyeongju', label: '경주시', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 35.8562, lng: 129.2247 },
  { value: 'kr-gimcheon', label: '김천시', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 36.1398, lng: 128.1136 },
  { value: 'kr-andong', label: '안동시', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 36.5684, lng: 128.7294 },
  { value: 'kr-gumi', label: '구미시', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 36.1195, lng: 128.3446 },
  { value: 'kr-yeongju', label: '영주시', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 36.8057, lng: 128.6240 },
  { value: 'kr-yeongcheon', label: '영천시', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 35.9733, lng: 128.9385 },
  { value: 'kr-sangju', label: '상주시', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 36.4110, lng: 128.1591 },
  { value: 'kr-mungyeong', label: '문경시', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 36.5867, lng: 128.1866 },
  { value: 'kr-gyeongsan', label: '경산시', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 35.8251, lng: 128.7414 },
  { value: 'kr-uiseong', label: '의성군', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 36.3526, lng: 128.6970 },
  { value: 'kr-cheongsong', label: '청송군', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 36.4361, lng: 129.0570 },
  { value: 'kr-yeongyang', label: '영양군', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 36.6667, lng: 129.1124 },
  { value: 'kr-yeongdeok', label: '영덕군', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 36.4150, lng: 129.3659 },
  { value: 'kr-cheongdo', label: '청도군', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 35.6472, lng: 128.7340 },
  { value: 'kr-goryeong', label: '고령군', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 35.7261, lng: 128.2631 },
  { value: 'kr-seongju', label: '성주군', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 35.9191, lng: 128.2830 },
  { value: 'kr-chilgok', label: '칠곡군', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 35.9955, lng: 128.4017 },
  { value: 'kr-yecheon', label: '예천군', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 36.6574, lng: 128.4526 },
  { value: 'kr-bonghwa', label: '봉화군', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 36.8931, lng: 128.7325 },
  { value: 'kr-uljin', label: '울진군', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 36.9931, lng: 129.4004 },
  { value: 'kr-ulleung', label: '울릉군', country: '대한민국 경상북도', timezone: 'Asia/Seoul', lat: 37.4847, lng: 130.9057 },

  // ===== 경상남도 =====
  { value: 'kr-changwon', label: '창원시', country: '대한민국 경상남도', timezone: 'Asia/Seoul', lat: 35.2279, lng: 128.6811 },
  { value: 'kr-jinju', label: '진주시', country: '대한민국 경상남도', timezone: 'Asia/Seoul', lat: 35.1799, lng: 128.1076 },
  { value: 'kr-tongyeong', label: '통영시', country: '대한민국 경상남도', timezone: 'Asia/Seoul', lat: 34.8544, lng: 128.4330 },
  { value: 'kr-sacheon', label: '사천시', country: '대한민국 경상남도', timezone: 'Asia/Seoul', lat: 35.0037, lng: 128.0642 },
  { value: 'kr-gimhae', label: '김해시', country: '대한민국 경상남도', timezone: 'Asia/Seoul', lat: 35.2341, lng: 128.8811 },
  { value: 'kr-miryang', label: '밀양시', country: '대한민국 경상남도', timezone: 'Asia/Seoul', lat: 35.5037, lng: 128.7486 },
  { value: 'kr-geoje', label: '거제시', country: '대한민국 경상남도', timezone: 'Asia/Seoul', lat: 34.8806, lng: 128.6211 },
  { value: 'kr-yangsan', label: '양산시', country: '대한민국 경상남도', timezone: 'Asia/Seoul', lat: 35.3350, lng: 129.0373 },
  { value: 'kr-uiryeong', label: '의령군', country: '대한민국 경상남도', timezone: 'Asia/Seoul', lat: 35.3222, lng: 128.2617 },
  { value: 'kr-haman', label: '함안군', country: '대한민국 경상남도', timezone: 'Asia/Seoul', lat: 35.2724, lng: 128.4065 },
  { value: 'kr-changnyeong', label: '창녕군', country: '대한민국 경상남도', timezone: 'Asia/Seoul', lat: 35.5443, lng: 128.4923 },
  { value: 'kr-goseong-gn', label: '고성군', country: '대한민국 경상남도', timezone: 'Asia/Seoul', lat: 34.9729, lng: 128.3223 },
  { value: 'kr-namhae', label: '남해군', country: '대한민국 경상남도', timezone: 'Asia/Seoul', lat: 34.8373, lng: 127.8925 },
  { value: 'kr-hadong', label: '하동군', country: '대한민국 경상남도', timezone: 'Asia/Seoul', lat: 35.0674, lng: 127.7514 },
  { value: 'kr-sancheong', label: '산청군', country: '대한민국 경상남도', timezone: 'Asia/Seoul', lat: 35.4155, lng: 127.8735 },
  { value: 'kr-hamyang', label: '함양군', country: '대한민국 경상남도', timezone: 'Asia/Seoul', lat: 35.5204, lng: 127.7251 },
  { value: 'kr-geochang', label: '거창군', country: '대한민국 경상남도', timezone: 'Asia/Seoul', lat: 35.6869, lng: 127.9095 },
  { value: 'kr-hapcheon', label: '합천군', country: '대한민국 경상남도', timezone: 'Asia/Seoul', lat: 35.5667, lng: 128.1659 },

  // ===== 제주도 =====
  { value: 'kr-jeju', label: '제주시', country: '대한민국 제주도', timezone: 'Asia/Seoul', lat: 33.4996, lng: 126.5312 },
  { value: 'kr-seogwipo', label: '서귀포시', country: '대한민국 제주도', timezone: 'Asia/Seoul', lat: 33.2541, lng: 126.5600 },

  // ===== 북한 =====
  { value: 'kp-pyongyang', label: '평양', country: '북한', timezone: 'Asia/Pyongyang', lat: 39.0392, lng: 125.7625 },
  { value: 'kp-kaesong', label: '개성', country: '북한', timezone: 'Asia/Pyongyang', lat: 37.9710, lng: 126.5545 },
  { value: 'kp-wonsan', label: '원산', country: '북한', timezone: 'Asia/Pyongyang', lat: 39.1533, lng: 127.4428 },
  { value: 'kp-hamhung', label: '함흥', country: '북한', timezone: 'Asia/Pyongyang', lat: 39.9181, lng: 127.5336 },
  { value: 'kp-chongjin', label: '청진', country: '북한', timezone: 'Asia/Pyongyang', lat: 41.7960, lng: 129.7758 },
  { value: 'kp-sinuiju', label: '신의주', country: '북한', timezone: 'Asia/Pyongyang', lat: 40.1006, lng: 124.3989 },

  // ===== 일본 =====
  { value: 'jp-tokyo', label: '도쿄', country: '일본', timezone: 'Asia/Tokyo', lat: 35.6762, lng: 139.6503 },
  { value: 'jp-osaka', label: '오사카', country: '일본', timezone: 'Asia/Tokyo', lat: 34.6937, lng: 135.5023 },
  { value: 'jp-kyoto', label: '교토', country: '일본', timezone: 'Asia/Tokyo', lat: 35.0116, lng: 135.7681 },
  { value: 'jp-fukuoka', label: '후쿠오카', country: '일본', timezone: 'Asia/Tokyo', lat: 33.5904, lng: 130.4017 },
  { value: 'jp-sapporo', label: '삿포로', country: '일본', timezone: 'Asia/Tokyo', lat: 43.0618, lng: 141.3545 },
  { value: 'jp-nagoya', label: '나고야', country: '일본', timezone: 'Asia/Tokyo', lat: 35.1815, lng: 136.9066 },
  { value: 'jp-kobe', label: '고베', country: '일본', timezone: 'Asia/Tokyo', lat: 34.6901, lng: 135.1956 },
  { value: 'jp-yokohama', label: '요코하마', country: '일본', timezone: 'Asia/Tokyo', lat: 35.4437, lng: 139.6380 },

  // ===== 중국 =====
  { value: 'cn-beijing', label: '베이징', country: '중국', timezone: 'Asia/Shanghai', lat: 39.9042, lng: 116.4074 },
  { value: 'cn-shanghai', label: '상하이', country: '중국', timezone: 'Asia/Shanghai', lat: 31.2304, lng: 121.4737 },
  { value: 'cn-guangzhou', label: '광저우', country: '중국', timezone: 'Asia/Shanghai', lat: 23.1291, lng: 113.2644 },
  { value: 'cn-shenzhen', label: '선전', country: '중국', timezone: 'Asia/Shanghai', lat: 22.5431, lng: 114.0579 },
  { value: 'cn-hongkong', label: '홍콩', country: '중국', timezone: 'Asia/Hong_Kong', lat: 22.3193, lng: 114.1694 },
  { value: 'cn-chengdu', label: '청두', country: '중국', timezone: 'Asia/Shanghai', lat: 30.5728, lng: 104.0668 },
  { value: 'cn-xian', label: '시안', country: '중국', timezone: 'Asia/Shanghai', lat: 34.3416, lng: 108.9398 },
  { value: 'cn-hangzhou', label: '항저우', country: '중국', timezone: 'Asia/Shanghai', lat: 30.2741, lng: 120.1551 },
  { value: 'cn-qingdao', label: '칭다오', country: '중국', timezone: 'Asia/Shanghai', lat: 36.0671, lng: 120.3826 },
  { value: 'cn-dalian', label: '다롄', country: '중국', timezone: 'Asia/Shanghai', lat: 38.9140, lng: 121.6147 },
  { value: 'cn-harbin', label: '하얼빈', country: '중국', timezone: 'Asia/Shanghai', lat: 45.8038, lng: 126.5350 },
  { value: 'cn-shenyang', label: '선양', country: '중국', timezone: 'Asia/Shanghai', lat: 41.8057, lng: 123.4315 },
  { value: 'tw-taipei', label: '타이베이', country: '대만', timezone: 'Asia/Taipei', lat: 25.0330, lng: 121.5654 },

  // ===== 동남아시아 =====
  { value: 'sg-singapore', label: '싱가포르', country: '싱가포르', timezone: 'Asia/Singapore', lat: 1.3521, lng: 103.8198 },
  { value: 'th-bangkok', label: '방콕', country: '태국', timezone: 'Asia/Bangkok', lat: 13.7563, lng: 100.5018 },
  { value: 'vn-hanoi', label: '하노이', country: '베트남', timezone: 'Asia/Ho_Chi_Minh', lat: 21.0285, lng: 105.8542 },
  { value: 'vn-hochiminh', label: '호치민', country: '베트남', timezone: 'Asia/Ho_Chi_Minh', lat: 10.8231, lng: 106.6297 },
  { value: 'id-jakarta', label: '자카르타', country: '인도네시아', timezone: 'Asia/Jakarta', lat: -6.2088, lng: 106.8456 },
  { value: 'ph-manila', label: '마닐라', country: '필리핀', timezone: 'Asia/Manila', lat: 14.5995, lng: 120.9842 },
  { value: 'my-kualalumpur', label: '쿠알라룸푸르', country: '말레이시아', timezone: 'Asia/Kuala_Lumpur', lat: 3.1390, lng: 101.6869 },

  // ===== 미주 =====
  { value: 'us-newyork', label: '뉴욕', country: '미국', timezone: 'America/New_York', lat: 40.7128, lng: -74.0060 },
  { value: 'us-losangeles', label: '로스앤젤레스', country: '미국', timezone: 'America/Los_Angeles', lat: 34.0522, lng: -118.2437 },
  { value: 'us-chicago', label: '시카고', country: '미국', timezone: 'America/Chicago', lat: 41.8781, lng: -87.6298 },
  { value: 'us-sanfrancisco', label: '샌프란시스코', country: '미국', timezone: 'America/Los_Angeles', lat: 37.7749, lng: -122.4194 },
  { value: 'us-seattle', label: '시애틀', country: '미국', timezone: 'America/Los_Angeles', lat: 47.6062, lng: -122.3321 },
  { value: 'us-houston', label: '휴스턴', country: '미국', timezone: 'America/Chicago', lat: 29.7604, lng: -95.3698 },
  { value: 'us-atlanta', label: '애틀랜타', country: '미국', timezone: 'America/New_York', lat: 33.7490, lng: -84.3880 },
  { value: 'us-washington', label: '워싱턴 D.C.', country: '미국', timezone: 'America/New_York', lat: 38.9072, lng: -77.0369 },
  { value: 'us-boston', label: '보스턴', country: '미국', timezone: 'America/New_York', lat: 42.3601, lng: -71.0589 },
  { value: 'us-dallas', label: '댈러스', country: '미국', timezone: 'America/Chicago', lat: 32.7767, lng: -96.7970 },
  { value: 'us-lasvegas', label: '라스베이거스', country: '미국', timezone: 'America/Los_Angeles', lat: 36.1699, lng: -115.1398 },
  { value: 'us-honolulu', label: '호놀룰루', country: '미국 하와이', timezone: 'Pacific/Honolulu', lat: 21.3069, lng: -157.8583 },
  { value: 'ca-toronto', label: '토론토', country: '캐나다', timezone: 'America/Toronto', lat: 43.6532, lng: -79.3832 },
  { value: 'ca-vancouver', label: '밴쿠버', country: '캐나다', timezone: 'America/Vancouver', lat: 49.2827, lng: -123.1207 },
  { value: 'br-saopaulo', label: '상파울루', country: '브라질', timezone: 'America/Sao_Paulo', lat: -23.5505, lng: -46.6333 },

  // ===== 유럽 =====
  { value: 'gb-london', label: '런던', country: '영국', timezone: 'Europe/London', lat: 51.5074, lng: -0.1278 },
  { value: 'fr-paris', label: '파리', country: '프랑스', timezone: 'Europe/Paris', lat: 48.8566, lng: 2.3522 },
  { value: 'de-berlin', label: '베를린', country: '독일', timezone: 'Europe/Berlin', lat: 52.5200, lng: 13.4050 },
  { value: 'de-frankfurt', label: '프랑크푸르트', country: '독일', timezone: 'Europe/Berlin', lat: 50.1109, lng: 8.6821 },
  { value: 'de-munich', label: '뮌헨', country: '독일', timezone: 'Europe/Berlin', lat: 48.1351, lng: 11.5820 },
  { value: 'nl-amsterdam', label: '암스테르담', country: '네덜란드', timezone: 'Europe/Amsterdam', lat: 52.3676, lng: 4.9041 },
  { value: 'it-rome', label: '로마', country: '이탈리아', timezone: 'Europe/Rome', lat: 41.9028, lng: 12.4964 },
  { value: 'it-milan', label: '밀라노', country: '이탈리아', timezone: 'Europe/Rome', lat: 45.4642, lng: 9.1900 },
  { value: 'es-madrid', label: '마드리드', country: '스페인', timezone: 'Europe/Madrid', lat: 40.4168, lng: -3.7038 },
  { value: 'es-barcelona', label: '바르셀로나', country: '스페인', timezone: 'Europe/Madrid', lat: 41.3851, lng: 2.1734 },
  { value: 'ch-zurich', label: '취리히', country: '스위스', timezone: 'Europe/Zurich', lat: 47.3769, lng: 8.5417 },
  { value: 'at-vienna', label: '비엔나', country: '오스트리아', timezone: 'Europe/Vienna', lat: 48.2082, lng: 16.3738 },
  { value: 'ru-moscow', label: '모스크바', country: '러시아', timezone: 'Europe/Moscow', lat: 55.7558, lng: 37.6173 },
  { value: 'ru-stpetersburg', label: '상트페테르부르크', country: '러시아', timezone: 'Europe/Moscow', lat: 59.9311, lng: 30.3609 },

  // ===== 오세아니아 =====
  { value: 'au-sydney', label: '시드니', country: '호주', timezone: 'Australia/Sydney', lat: -33.8688, lng: 151.2093 },
  { value: 'au-melbourne', label: '멜버른', country: '호주', timezone: 'Australia/Melbourne', lat: -37.8136, lng: 144.9631 },
  { value: 'au-brisbane', label: '브리즈번', country: '호주', timezone: 'Australia/Brisbane', lat: -27.4698, lng: 153.0251 },
  { value: 'nz-auckland', label: '오클랜드', country: '뉴질랜드', timezone: 'Pacific/Auckland', lat: -36.8509, lng: 174.7645 },

  // ===== 중동/인도 =====
  { value: 'ae-dubai', label: '두바이', country: 'UAE', timezone: 'Asia/Dubai', lat: 25.2048, lng: 55.2708 },
  { value: 'in-mumbai', label: '뭄바이', country: '인도', timezone: 'Asia/Kolkata', lat: 19.0760, lng: 72.8777 },
  { value: 'in-delhi', label: '델리', country: '인도', timezone: 'Asia/Kolkata', lat: 28.7041, lng: 77.1025 },
  { value: 'in-bangalore', label: '방갈로르', country: '인도', timezone: 'Asia/Kolkata', lat: 12.9716, lng: 77.5946 },
]

// 저장된 만세력 타입
interface SavedChart {
  id: string
  name: string
  gender: string
  birthDate: string
  birthHour: string | null
  dayPillar: string | null
  createdAt: string
}

export function ManseForm() {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cityOpen, setCityOpen] = useState(false)
  const [citySearch, setCitySearch] = useState('')
  const [showSijinTable, setShowSijinTable] = useState(false)
  const [showJasiInfo, setShowJasiInfo] = useState(false)

  // 저장된 만세력 불러오기
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([])
  const [isLoadingSaved, setIsLoadingSaved] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  // 저장된 만세력 목록 조회
  const loadSavedCharts = async () => {
    if (!isSignedIn) return

    setIsLoadingSaved(true)
    try {
      const response = await fetch('/api/mansaeryeok/list')
      const data = await response.json()

      if (data.success) {
        setSavedCharts(data.data)
      }
    } catch (err) {
      console.error('Failed to load saved charts:', err)
    } finally {
      setIsLoadingSaved(false)
    }
  }

  // Sheet 열릴 때 목록 조회
  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open)
    if (open && savedCharts.length === 0) {
      loadSavedCharts()
    }
  }

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      calendarType: 'solar',
      birthYear: '',
      birthMonth: '',
      birthDay: '',
      birthSijin: '',
      timeUnknown: false,
      jasiOption: 'none',
      gender: undefined,
      birthCity: '',
    },
  })

  const timeUnknown = form.watch('timeUnknown')
  const selectedSijin = form.watch('birthSijin')
  const selectedCity = form.watch('birthCity')

  // 자시(23:00~01:00) 선택 시에만 야자시/조자시 옵션 표시
  const isJasiSelected = selectedSijin === '23:30'

  // 도시 검색 필터링
  const filteredCities = useMemo(() => {
    if (!citySearch) return CITIES.slice(0, 50) // 기본 50개만 표시
    const search = citySearch.toLowerCase()
    return CITIES.filter(
      city =>
        city.label.toLowerCase().includes(search) ||
        city.country.toLowerCase().includes(search)
    ).slice(0, 100) // 최대 100개
  }, [citySearch])

  // 선택된 도시 정보
  const selectedCityInfo = useMemo(() => {
    return CITIES.find(city => city.value === selectedCity)
  }, [selectedCity])

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      // Server Action 사용 (로그인/비로그인 모두)
      // - 로그인: DB 저장 후 /mansaeryeok/result?id=xxx 로 리다이렉트
      // - 비로그인: /mansaeryeok/result?birthDate=...&gender=... 로 리다이렉트 (DB 저장 없음)
      const formDataObj = new window.FormData()
      formDataObj.append('name', data.name)
      formDataObj.append('gender', data.gender || '')
      formDataObj.append('birthYear', data.birthYear)
      formDataObj.append('birthMonth', data.birthMonth)
      formDataObj.append('birthDay', data.birthDay)
      formDataObj.append('birthSijin', data.birthSijin || '')
      formDataObj.append('calendarType', data.calendarType)
      formDataObj.append('timeUnknown', String(data.timeUnknown))
      formDataObj.append('birthCity', data.birthCity || '')

      startTransition(async () => {
        try {
          await submitSajuForm(formDataObj)
          // redirect는 Server Action 내부에서 처리됨
        } catch (err) {
          setError(err instanceof Error ? err.message : '오류가 발생했습니다')
          setIsLoading(false)
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 이름 */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium text-stone-800">이름</FormLabel>
              <FormControl>
                <Input
                  placeholder="홍길동"
                  maxLength={20}
                  className="border-stone-200 focus:border-stone-400 focus:ring-stone-400"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-stone-500">
                본인 또는 궁합을 볼 상대방의 이름을 입력하세요.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 생년월일 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium text-stone-800">생년월일</Label>

            {/* 양력/음력 선택 */}
            <FormField
              control={form.control}
              name="calendarType"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-1">
                  <FormControl>
                    <div className="flex rounded-lg border border-stone-200 overflow-hidden">
                      {CALENDAR_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => field.onChange(type.value)}
                          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                            field.value === type.value
                              ? 'bg-stone-800 text-white'
                              : 'bg-white text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* 연도 */}
            <FormField
              control={form.control}
              name="birthYear"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1990"
                      min={1900}
                      max={new Date().getFullYear()}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 월 */}
            <FormField
              control={form.control}
              name="birthMonth"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="월" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 일 */}
            <FormField
              control={form.control}
              name="birthDay"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="일" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* 출생시간 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium text-stone-800">출생시간</Label>
            <FormField
              control={form.control}
              name="timeUnknown"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <Label className="text-sm text-stone-500 cursor-pointer">
                    시간 모름
                  </Label>
                </FormItem>
              )}
            />
          </div>

          {/* 시진 선택 */}
          <FormField
            control={form.control}
            name="birthSijin"
            render={({ field }) => (
              <FormItem>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={timeUnknown}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="시진을 선택하세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SIJIN.map((sijin) => (
                      <SelectItem key={sijin.value} value={sijin.value}>
                        {sijin.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 야자시/조자시 옵션 - 자시 선택 시에만 표시 */}
          {isJasiSelected && !timeUnknown && (
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="jasiOption"
                render={({ field }) => (
                  <FormItem className="rounded-xl border border-stone-200 p-4 bg-stone-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <FormLabel className="text-sm font-medium text-stone-800">자시(子時) 계산 방식</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100"
                        onClick={() => setShowJasiInfo(!showJasiInfo)}
                      >
                        <Info className="h-4 w-4 mr-1" />
                        <span className="text-xs">도움말</span>
                      </Button>
                    </div>

                    {showJasiInfo && (
                      <div className="mb-4 p-3 bg-white rounded-lg border border-stone-100 text-sm space-y-2">
                        <p className="font-medium text-stone-800">야자시 vs 조자시란?</p>
                        <p className="text-stone-600">
                          자시(子時)는 밤 23:00부터 새벽 01:00까지의 시간입니다.
                          이 시간대에 태어난 경우, 날짜를 어떻게 계산할지에 따라 사주가 달라질 수 있습니다.
                        </p>
                        <ul className="text-stone-600 list-disc pl-4 space-y-1">
                          <li><strong className="text-stone-700">야자시(夜子時)</strong>: 23:00~01:00를 전날로 계산 (전통 방식)</li>
                          <li><strong className="text-stone-700">조자시(早子時)</strong>: 00:00를 기준으로 날짜 변경 (현대 방식)</li>
                        </ul>
                        <p className="text-stone-500 text-xs mt-2">
                          ※ 학파에 따라 해석이 다르므로, 본인에게 맞는 방식을 선택하세요.
                        </p>
                      </div>
                    )}

                    <FormControl>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            value="none"
                            checked={field.value === 'none'}
                            onChange={() => field.onChange('none')}
                            className="h-4 w-4 accent-stone-700"
                          />
                          <span className="text-sm text-stone-700">기본 (자동 계산)</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            value="yajasi"
                            checked={field.value === 'yajasi'}
                            onChange={() => field.onChange('yajasi')}
                            className="h-4 w-4 accent-stone-700"
                          />
                          <span className="text-sm text-stone-700">야자시(夜子時) - 23:00~01:00를 전날로 계산</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            value="jojasi"
                            checked={field.value === 'jojasi'}
                            onChange={() => field.onChange('jojasi')}
                            className="h-4 w-4 accent-stone-700"
                          />
                          <span className="text-sm text-stone-700">조자시(早子時) - 00:00 기준 날짜 변경</span>
                        </label>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}

          {timeUnknown && (
            <p className="text-sm text-stone-500 bg-stone-50 rounded-lg p-3">
              시간을 모르면 시주(時柱)가 계산되지 않습니다.
            </p>
          )}

          {/* 12간지 시간표 */}
          <Collapsible open={showSijinTable} onOpenChange={setShowSijinTable}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between hover:bg-stone-50">
                <span className="text-sm text-stone-500">12간지 시간표 보기</span>
                {showSijinTable ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="rounded-xl border border-stone-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-stone-700">시진</th>
                      <th className="px-3 py-2 text-left font-medium text-stone-700">한자</th>
                      <th className="px-3 py-2 text-left font-medium text-stone-700">시간</th>
                      <th className="px-3 py-2 text-left font-medium text-stone-700">오행</th>
                      <th className="px-3 py-2 text-left font-medium text-stone-700">동물</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SIJIN_TABLE.map((row, idx) => (
                      <tr key={row.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}>
                        <td className="px-3 py-2 text-stone-800">{row.name}</td>
                        <td className="px-3 py-2 text-stone-600">{row.hanja}</td>
                        <td className="px-3 py-2 text-stone-600">{row.time}</td>
                        <td className="px-3 py-2 text-stone-600">{row.element}</td>
                        <td className="px-3 py-2 text-stone-600">{row.animal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* 성별 */}
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium text-stone-800">
                성별 <span className="text-stone-400">(선택)</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="성별을 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">남성</SelectItem>
                  <SelectItem value="female">여성</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-stone-500">
                대운 계산에 사용됩니다.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 출생 도시 */}
        <FormField
          control={form.control}
          name="birthCity"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-base font-medium text-stone-800">
                출생 도시 <span className="text-stone-400">(선택)</span>
              </FormLabel>
              <Popover open={cityOpen} onOpenChange={setCityOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedCityInfo ? (
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {selectedCityInfo.label}, {selectedCityInfo.country}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">도시를 검색하세요</span>
                      )}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="도시명 또는 국가명 검색..."
                      value={citySearch}
                      onValueChange={setCitySearch}
                    />
                    <CommandList>
                      <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                      <CommandGroup>
                        {filteredCities.map((city) => (
                          <CommandItem
                            key={city.value}
                            value={city.value}
                            onSelect={() => {
                              field.onChange(city.value)
                              setCityOpen(false)
                              setCitySearch('')
                            }}
                          >
                            <MapPin className="mr-2 h-4 w-4" />
                            <span>{city.label}</span>
                            <span className="ml-2 text-muted-foreground">
                              {city.country}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription className="text-stone-500">
                진태양시 계산에 사용됩니다. 미입력시 서울 기준으로 계산합니다.
              </FormDescription>
              <p className="text-xs text-stone-400 mt-1">
                태어난 도시를 모르시는 경우 &apos;서울특별시&apos; 혹은 태어난 국가의 수도를 입력해주세요.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 에러 메시지 */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 제출 버튼 */}
        <Button
          type="submit"
          className="w-full bg-stone-800 hover:bg-stone-900 text-white rounded-xl"
          size="lg"
          disabled={isLoading || isPending}
        >
          {isLoading || isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isPending ? '저장하는 중...' : '사주를 읽고 있습니다...'}
            </>
          ) : (
            '만세력 보러가기'
          )}
        </Button>

        {/* 저장된 만세력 불러오기 */}
        <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl border-stone-300 text-stone-700 hover:bg-stone-50"
              size="lg"
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              저장된 만세력 불러오기
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
            <SheetHeader className="pb-4 border-b">
              <SheetTitle className="text-lg">저장된 만세력</SheetTitle>
              <SheetDescription>
                이전에 저장한 만세력을 선택하면 결과 페이지로 이동합니다.
              </SheetDescription>
            </SheetHeader>

            <div className="py-4 overflow-y-auto h-[calc(100%-100px)]">
              {!isSignedIn ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <FolderOpen className="h-12 w-12 text-stone-300 mb-4" />
                  <p className="text-stone-600 font-medium mb-2">로그인이 필요합니다</p>
                  <p className="text-sm text-stone-500 mb-4">
                    로그인하면 저장한 만세력을 불러올 수 있습니다.
                  </p>
                  <Button
                    onClick={() => {
                      setSheetOpen(false)
                      router.push('/sign-in?redirect_url=/mansaeryeok')
                    }}
                    className="rounded-xl"
                  >
                    로그인하기
                  </Button>
                </div>
              ) : isLoadingSaved ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
                </div>
              ) : savedCharts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <FolderOpen className="h-12 w-12 text-stone-300 mb-4" />
                  <p className="text-stone-600 font-medium mb-2">저장된 만세력이 없습니다</p>
                  <p className="text-sm text-stone-500">
                    만세력을 조회한 후 저장하면 여기에서 불러올 수 있습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedCharts.map((chart) => (
                    <button
                      key={chart.id}
                      type="button"
                      onClick={() => {
                        setSheetOpen(false)
                        router.push(`/mansaeryeok/result?id=${chart.id}`)
                      }}
                      className="w-full p-4 rounded-xl border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-stone-800">{chart.name}</span>
                              {chart.dayPillar && (
                                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                  {chart.dayPillar}일주
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {chart.gender === 'male' ? '남' : '여'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-stone-500">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>
                                {chart.birthDate
                                  ? new Date(chart.birthDate).toLocaleDateString('ko-KR')
                                  : '생년월일 정보 없음'}
                              </span>
                              {chart.birthHour && <span>· {chart.birthHour}</span>}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-stone-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </form>
    </Form>
  )
}
