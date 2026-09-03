import { Search, X } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

function SidebarSearch() {
    const { sidebarSearchTerm, setSidebarSearchTerm, activeTab } = useChatStore();

    return (
        <div className="px-4 pb-2">
            <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    value={sidebarSearchTerm}
                    onChange={(e) => setSidebarSearchTerm(e.target.value)}
                    placeholder={activeTab === "chats" ? "Tìm cuộc trò chuyện..." : "Tìm bạn bè trong danh bạ..."}
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-all"
                />
                {sidebarSearchTerm && (
                    <button
                        type="button"
                        onClick={() => setSidebarSearchTerm("")}
                        className="absolute right-2.5 p-0.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
                        title="Xóa tìm kiếm"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}

export default SidebarSearch;
