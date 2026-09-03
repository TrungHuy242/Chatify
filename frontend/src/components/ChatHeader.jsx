import { XIcon, SearchIcon, Info, ChevronLeft } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { getDisplayName } from "../lib/nicknameHelper";

function ChatHeader() {
    const { 
        selectedUser, 
        setSelectedUser, 
        typingUsers, 
        isSearching, 
        setIsSearching, 
        searchQuery, 
        setSearchQuery,
        isChatInfoOpen,
        toggleChatInfo,
    } = useChatStore();
    const { onlineUsers, authUser } = useAuthStore();
    const searchInputRef = useRef(null);
    const isOnline = onlineUsers.includes(selectedUser._id);
    const isTyping = typingUsers.includes(selectedUser._id);
    const displayName = getDisplayName(selectedUser, authUser);

    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === "Escape") setSelectedUser(null);
        };

        window.addEventListener("keydown", handleEscKey);

        // cleanup function
        return () => window.removeEventListener("keydown", handleEscKey);
    }, [setSelectedUser]);

    useEffect(() => {
        if (isSearching && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearching]);

    const handleToggleSearch = () => {
        if (isSearching) {
            setSearchQuery("");
            setIsSearching(false);
        } else {
            setIsSearching(true);
        }
    };

    return (
        <div className="flex flex-col bg-[#0e1322]/90 backdrop-blur-md border-b border-slate-800/80 flex-none z-10">
            <div className="flex justify-between items-center px-4 sm:px-6 py-3 min-h-[68px]">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    <button
                        onClick={() => setSelectedUser(null)}
                        className="md:hidden p-1.5 -ml-1.5 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                        title="Quay lại danh sách"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className={`avatar ${isOnline ? "online" : "offline"} flex-shrink-0`}>
                        <div className="w-10 sm:w-11 rounded-full ring-1 ring-slate-700/60">
                            <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
                        </div>
                    </div>

                    <div className="min-w-0">
                        <h3 className="text-slate-100 font-semibold text-sm sm:text-base flex items-center gap-1.5 truncate">
                            <span className="truncate">{displayName}</span>
                            {displayName !== selectedUser.fullName && (
                                <span className="text-xs text-slate-400 font-normal truncate hidden sm:inline">
                                    ({selectedUser.fullName})
                                </span>
                            )}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <span className={`size-1.5 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}></span>
                            <span>{isOnline ? "Đang hoạt động" : "Ngoại tuyến"}</span>
                        </p>
                    </div>
                </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
                <button 
                    onClick={handleToggleSearch}
                    className={`p-2 rounded-full transition-colors tooltip tooltip-bottom ${isSearching ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                    data-tip="Tìm kiếm tin nhắn"
                >
                    <SearchIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={toggleChatInfo}
                    className={`p-2 rounded-full transition-colors tooltip tooltip-bottom ${isChatInfoOpen ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                    data-tip="Thông tin cuộc trò chuyện"
                >
                    <Info className="w-5 h-5" />
                </button>
                <button onClick={() => setSelectedUser(null)}>
                    <XIcon className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer" />
                </button>
            </div>
        </div>
        
        {/* Search Bar */}
        {isSearching && (
            <div className="px-6 pb-3 pt-1 animate-in slide-in-from-top-2">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-md leading-5 bg-slate-900/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 sm:text-sm transition-colors"
                        placeholder="Tìm kiếm tin nhắn..."
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                        >
                            <XIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        )}
    </div>
    );
}
export default ChatHeader;