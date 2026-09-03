import { useRef, useState } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { ImageIcon, SendIcon, XIcon, Mic, Square, Trash2, Smile } from "lucide-react";
import EmojiPicker from "./EmojiPicker";

function MessageInput() {
    const { playRandomKeyStrokeSound } = useKeyboardSound();
    const [text, setText] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioData, setAudioData] = useState(null); // base64
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);
    const textInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    const { sendMessage, isSoundEnabled, selectedUser, replyingTo, clearReplyingTo } = useChatStore();
    const { socket, authUser } = useAuthStore();

    const handleSendMessage = (e) => {
        if (e) e.preventDefault();
        if (!text.trim() && !imagePreview && !audioData) return;
        if (isSoundEnabled) playRandomKeyStrokeSound();

        sendMessage({
            text: text.trim(),
            image: imagePreview,
            audio: audioData,
        });
        setText("");
        setImagePreview(null);
        setAudioData(null);
        setShowEmojiPicker(false);
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

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const mimeType = mediaRecorderRef.current.mimeType;
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    setAudioData(reader.result);
                };
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            toast.error("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const removeAudio = () => {
        setAudioData(null);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const handleEmojiSelect = (emoji) => {
        const input = textInputRef.current;
        if (!input) {
            setText((prev) => prev + emoji);
            return;
        }
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const newText = text.substring(0, start) + emoji + text.substring(end);
        setText(newText);

        setTimeout(() => {
            input.focus();
            input.setSelectionRange(start + emoji.length, start + emoji.length);
        }, 0);
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
                                ) : replyingTo.image ? (
                                    <span className="italic opacity-70">[Hình ảnh]</span>
                                ) : (
                                    <span className="italic opacity-70">[Tin nhắn thoại]</span>
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

            {audioData && !isRecording && (
                <div className="max-w-3xl mx-auto mb-3 flex items-center bg-slate-800/80 p-2 rounded-lg border border-slate-700 w-full">
                    <audio src={audioData} controls className="h-10 flex-1 rounded" />
                    <button
                        onClick={removeAudio}
                        className="ml-2 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 hover:bg-red-500 hover:text-white transition-colors"
                        type="button"
                        title="Xóa ghi âm"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex space-x-2 sm:space-x-4">
                {isRecording ? (
                    <div className="flex-1 bg-slate-800/50 border border-red-500/50 rounded-lg py-2 px-4 flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-2 text-red-400">
                            <Mic className="w-5 h-5" />
                            <span className="font-medium">Đang ghi âm... {formatTime(recordingTime)}</span>
                        </div>
                        <button
                            type="button"
                            onClick={stopRecording}
                            className="text-slate-300 hover:text-white bg-red-500/20 hover:bg-red-500 px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1"
                        >
                            <Square className="w-4 h-4 fill-current" /> Dừng
                        </button>
                    </div>
                ) : (
                    <input
                        ref={textInputRef}
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
                )}

                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                />

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                        className={`bg-slate-800/50 rounded-lg px-3 sm:px-4 py-2 transition-colors flex items-center justify-center ${
                            showEmojiPicker
                                ? "text-cyan-400 bg-slate-700/60"
                                : "text-slate-400 hover:text-slate-200"
                        }`}
                        disabled={isRecording}
                        title="Chọn biểu tượng cảm xúc"
                    >
                        <Smile className="w-5 h-5" />
                    </button>

                    {showEmojiPicker && (
                        <EmojiPicker
                            onSelectEmoji={handleEmojiSelect}
                            onClose={() => setShowEmojiPicker(false)}
                        />
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg px-3 sm:px-4 transition-colors ${imagePreview ? "text-cyan-500" : ""
                        }`}
                    disabled={isRecording || audioData}
                    title="Gửi hình ảnh"
                >
                    <ImageIcon className="w-5 h-5" />
                </button>

                {!text.trim() && !imagePreview && !audioData && !isRecording ? (
                    <button
                        type="button"
                        onClick={startRecording}
                        className="bg-slate-800/50 text-slate-400 hover:text-cyan-400 rounded-lg px-3 sm:px-4 transition-colors"
                    >
                        <Mic className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        type="submit"
                        disabled={(!text.trim() && !imagePreview && !audioData) || isRecording}
                        className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg px-3 sm:px-4 py-2 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                )}
            </form>
        </div>
    );
}
export default MessageInput;