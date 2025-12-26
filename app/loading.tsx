import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">잠시만 기다려주세요...</p>
      </div>
    </div>
  );
}
