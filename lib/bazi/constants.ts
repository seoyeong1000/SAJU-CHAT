export type BaziElement = {
  hanja: string;
  hangul: string;
  code: string;
};

export const heavenlyStems: BaziElement[] = [
  { hanja: "\u7532", hangul: "\uac11", code: "jia" },
  { hanja: "\u4e59", hangul: "\uc744", code: "yi" },
  { hanja: "\u4e19", hangul: "\ubcd1", code: "bing" },
  { hanja: "\u4e01", hangul: "\uc815", code: "ding" },
  { hanja: "\u620a", hangul: "\ubb34", code: "wu" },
  { hanja: "\u5df1", hangul: "\uae30", code: "ji" },
  { hanja: "\u5e9a", hangul: "\uacbd", code: "geng" },
  { hanja: "\u8f9b", hangul: "\uc2e0", code: "xin" },
  { hanja: "\u58ec", hangul: "\uc784", code: "ren" },
  { hanja: "\u7678", hangul: "\uacc4", code: "gui" },
];

export const earthlyBranches: BaziElement[] = [
  { hanja: "\u5b50", hangul: "\uc790", code: "zi" },
  { hanja: "\u4e11", hangul: "\ucd95", code: "chou" },
  { hanja: "\u5bc5", hangul: "\uc778", code: "yin" },
  { hanja: "\u536f", hangul: "\ubb18", code: "mao" },
  { hanja: "\u8fb0", hangul: "\uc9c4", code: "chen" },
  { hanja: "\u5df3", hangul: "\uc0ac", code: "si" },
  { hanja: "\u5348", hangul: "\uc624", code: "wu" },
  { hanja: "\u672a", hangul: "\ubbf8", code: "wei" },
  { hanja: "\u7533", hangul: "\uc2e0", code: "shen" },
  { hanja: "\u9149", hangul: "\uc720", code: "you" },
  { hanja: "\u620c", hangul: "\uc220", code: "xu" },
  { hanja: "\u4ea5", hangul: "\ud574", code: "hai" },
];
