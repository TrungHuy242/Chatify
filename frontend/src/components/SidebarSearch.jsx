import { Search, X } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

function SidebarSearch() {
    const { sidebarSearchTerm, setSidebarSearchTerm, activeTab, showOnlyOnline, toggleShowOnlyOnline, chats, allContacts } = useChatStore();
    const { onlineUsers } = useAuthStore();

    const currentList = activeTab === "chats" ? chats : allContacts;
    const onlineCount = currentList.filter((item) => onlineUsers.includes(item._id)).length;

    return (
        <div className="px-4 pb-2 space-y-2">
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

            <div className="flex items-center justify-between px-1">
                <button
                    type="button"
                    onClick={toggleShowOnlyOnline}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        showOnlyOnline
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                            : "bg-slate-800/60 text-slate-400 hover:text-slate-300 border border-slate-700/50"
                    }`}
                    title="Bật/tắt chỉ hiển thị người đang online"
                >
                    <span className={`size-2 rounded-full ${showOnlyOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}></span>
                    <span>Chỉ hiện Online</span>
                    <span className="opacity-75 font-mono text-[10px]">({onlineCount})</span>
                </button>

                {showOnlyOnline && (
                    <span className="text-[10px] text-emerald-400/80 italic animate-pulse">
                        Đang lọc
                    </span>
                )}
            </div>
        </div>
    );
}

export default SidebarSearch;
