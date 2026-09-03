import { XIcon, SearchIcon, Info } from "lucide-react";
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
        <div className="flex flex-col bg-slate-800/50 border-b border-slate-700/50 flex-none z-10">
            <div className="flex justify-between items-center px-6 py-3 min-h-[72px]">
                <div className="flex items-center space-x-3">
                <div className={`avatar ${isOnline ? "online" : "offline"}`}>
                    <div className="w-12 rounded-full">
                        <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
                    </div>
                </div>

                <div>
                    <h3 className="text-slate-200 font-medium flex items-center gap-1.5">
                        <span>{displayName}</span>
                        {displayName !== selectedUser.fullName && (
                            <span className="text-xs text-slate-400 font-normal">({selectedUser.fullName})</span>
                        )}
                    </h3>
                    <p className="text-slate-400 text-sm">{isOnline ? "Online" : "Offline"}</p>
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