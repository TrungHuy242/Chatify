import { useRef, useState } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { ImageIcon, SendIcon, XIcon } from "lucide-react";

function MessageInput() {
    const { playRandomKeyStrokeSound } = useKeyboardSound();
    const [text, setText] = useState("");
    const [imagePreview, setImagePreview] = useState(null);

    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);

    const { sendMessage, isSoundEnabled, selectedUser, replyingTo, clearReplyingTo } = useChatStore();
    const { socket, authUser } = useAuthStore();

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!text.trim() && !imagePreview) return;
        if (isSoundEnabled) playRandomKeyStrokeSound();

        sendMessage({
            text: text.trim(),
            image: imagePreview,
        });
        setText("");
        setImagePreview("");
        if (fileInputRef.current) fileInputRef.current.value = "";

        if (socket && selectedUser) {
            socket.emit("stop_typing", selectedUser._id);
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="p-4 border-t border-slate-700/50 flex flex-col gap-2">
            {replyingTo && (
                <div className="max-w-3xl mx-auto w-full mb-1">
                    <div className="bg-slate-800/80 border-l-4 border-cyan-500 rounded-r-lg p-3 relative flex items-center justify-between shadow-sm">
                        <div className="min-w-0 pr-6">
                            <p className="text-xs font-semibold text-cyan-400 mb-1">
                                Trả lời {replyingTo.senderId === authUser._id ? "chính mình" : "tin nhắn"}
                            </p>
                            <p className="text-sm text-slate-300 truncate">
                                {replyingTo.isRevoked ? (
                                    <span className="italic opacity-70">Tin nhắn đã bị thu hồi</span>
                                ) : replyingTo.text ? (
                                    replyingTo.text
                                ) : (
                                    <span className="italic opacity-70">[Hình ảnh]</span>
                                )}
                            </p>
                        </div>
                        <button
                            onClick={clearReplyingTo}
                            className="absolute top-2 right-2 text-slate-400 hover:text-slate-200 p-1 bg-slate-700/50 rounded-full hover:bg-slate-700 transition-colors"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {imagePreview && (
                <div className="max-w-3xl mx-auto mb-3 flex items-center">
                    <div className="relative">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded-lg border border-slate-700"
                        />
                        <button
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
                            type="button"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex space-x-4">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        isSoundEnabled && playRandomKeyStrokeSound();

                        if (socket && selectedUser) {
                            socket.emit("typing", selectedUser._id);

                            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

                            typingTimeoutRef.current = setTimeout(() => {
                                socket.emit("stop_typing", selectedUser._id);
                            }, 2000);
                        }
                    }}
                    className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-4"
                    placeholder="Type your message..."
                />

                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg px-4 transition-colors ${imagePreview ? "text-cyan-500" : ""
                        }`}
                >
                    <ImageIcon className="w-5 h-5" />
                </button>
                <button
                    type="submit"
                    disabled={!text.trim() && !imagePreview}
                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg px-4 py-2 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}
export default MessageInput;