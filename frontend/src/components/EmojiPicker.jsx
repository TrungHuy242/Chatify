import { useState, useRef, useEffect } from "react";
import { Search, X, Smile, ThumbsUp, Heart, Dog, Utensils, PartyPopper } from "lucide-react";

const EMOJI_CATEGORIES = [
    {
        id: "smileys",
        name: "Biểu cảm",
        icon: Smile,
        emojis: [
            "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "🥹",
            "☺️", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘",
            "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐",
            "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟",
            "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭",
            "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨",
            "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤭", "🫢", "🤫", "🤥",
            "😶", "😐", "😑", "😬", "🫠", "🙄", "😯", "😦", "😧", "😮",
            "😲", "🥱", "😴", "🤤", "😪", "😵", "😵‍💫", "🤐", "🥴", "🤢",
            "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "🤡",
            "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃"
        ],
    },
    {
        id: "gestures",
        name: "Cử chỉ & Tay",
        icon: ThumbsUp,
        emojis: [
            "👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘",
            "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "🫵", "👋", "🤚",
            "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "🫷", "🫸", "✊",
            "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏",
            "✍️", "💅", "🤳", "💪", "👂", "👃", "🧠", "👀", "👁️", "👅", "👄"
        ],
    },
    {
        id: "hearts",
        name: "Trái tim & Ký hiệu",
        icon: Heart,
        emojis: [
            "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
            "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝",
            "💟", "⭐", "🌟", "💫", "✨", "⚡", "💥", "🔥", "💯", "💢",
            "💬", "💭", "💤", "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉"
        ],
    },
    {
        id: "animals",
        name: "Động vật",
        icon: Dog,
        emojis: [
            "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨",
            "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒",
            "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🐺", "🐗", "🐴",
            "🦄", "🐝", "🦋", "🐌", "🐞", "🐢", "🐍", "🐙", "🐬", "🐳"
        ],
    },
    {
        id: "food",
        name: "Đồ ăn & Thức uống",
        icon: Utensils,
        emojis: [
            "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐",
            "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🍔", "🍟",
            "🍕", "🌭", "🥪", "🌮", "🌯", "🍜", "🍝", "🍣", "🍱", "🍦",
            "🍧", "🍨", "🍩", "🍪", "🎂", "🍰", "🧁", "🍫", "🍬", "🍭",
            "☕", "🧃", "🥤", "🧋", "🍺", "🍻", "🥂", "🍷", "🍹"
        ],
    },
    {
        id: "activities",
        name: "Hoạt động & Đồ vật",
        icon: PartyPopper,
        emojis: [
            "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀",
            "🏓", "🏸", "🏒", "🥊", "🥋", "🎯", "⛳", "🎮", "🎲", "🧩",
            "🎨", "🎬", "🎤", "🎧", "🎼", "🎵", "🎶", "🎹", "🥁", "🎸",
            "📱", "💻", "⌨️", "🖥️", "📷", "📸", "📹", "📺", "⏰", "💡",
            "💰", "💳", "💎", "🔑", "🚀", "🚗", "🚲", "✈️"
        ],
    },
];

function EmojiPicker({ onSelectEmoji, onClose }) {
    const [activeTab, setActiveTab] = useState("smileys");
    const [searchQuery, setSearchQuery] = useState("");
    const pickerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                onClose();
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    // Lọc emoji nếu có từ khóa tìm kiếm (tất cả categories)
    const filteredEmojis = searchQuery.trim()
        ? EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter((emoji, index, self) => self.indexOf(emoji) === index)
        : EMOJI_CATEGORIES.find((c) => c.id === activeTab)?.emojis || [];

    return (
        <div
            ref={pickerRef}
            className="absolute bottom-full mb-3 right-0 sm:right-10 z-50 w-72 sm:w-80 bg-slate-800/95 backdrop-blur-md border border-slate-700/80 shadow-2xl rounded-2xl p-3 animate-in fade-in zoom-in-95 duration-150 flex flex-col"
        >
            {/* Header: Search + Close */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50">
                <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm biểu tượng..."
                        className="w-full bg-slate-900/60 border border-slate-700/60 text-slate-200 text-xs rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors placeholder-slate-500"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Category Tabs (nếu không có tìm kiếm) */}
            {!searchQuery && (
                <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-slate-700/40 overflow-x-auto">
                    {EMOJI_CATEGORIES.map((cat) => {
                        const IconComponent = cat.icon;
                        const isActive = activeTab === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveTab(cat.id)}
                                className={`p-1.5 rounded-lg transition-colors flex-1 flex items-center justify-center ${
                                    isActive
                                        ? "bg-cyan-500/20 text-cyan-400 shadow-sm"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
                                }`}
                                title={cat.name}
                            >
                                <IconComponent className="w-4 h-4" />
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Emoji Grid */}
            <div className="overflow-y-auto max-h-56 pr-1 custom-scrollbar">
                <div className="grid grid-cols-7 gap-1">
                    {filteredEmojis.map((emoji, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSelectEmoji(emoji)}
                            className="w-8 h-8 flex items-center justify-center text-xl hover:bg-slate-700/60 rounded-lg transition-transform hover:scale-125 cursor-pointer active:scale-95"
                        >
                            <span className="leading-none">{emoji}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default EmojiPicker;
