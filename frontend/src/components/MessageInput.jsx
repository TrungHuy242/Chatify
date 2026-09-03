import { useRef, useState } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { ImageIcon, SendIcon, XIcon, Mic, Square, Trash2, Smile, Paperclip, FileText, Timer } from "lucide-react";
import EmojiPicker from "./EmojiPicker";

function MessageInput() {
    const { playRandomKeyStrokeSound } = useKeyboardSound();
    const [text, setText] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioData, setAudioData] = useState(null); // base64
    const [fileData, setFileData] = useState(null); // base64
    const [fileName, setFileName] = useState("");
    const [fileSize, setFileSize] = useState(0);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showTimerMenu, setShowTimerMenu] = useState(false);

    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);
    const fileAttachmentRef = useRef(null);
    const textInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    const { sendMessage, isSoundEnabled, selectedUser, replyingTo, clearReplyingTo, disappearingOption, setDisappearingOption } = useChatStore();
    const { socket, authUser } = useAuthStore();

    const handleSendMessage = (e) => {
        if (e) e.preventDefault();
        if (!text.trim() && !imagePreview && !audioData && !fileData) return;
        if (isSoundEnabled) playRandomKeyStrokeSound();

        sendMessage({
            text: text.trim(),
            image: imagePreview,
            audio: audioData,
            file: fileData,
            fileName: fileName,
            fileSize: fileSize,
        });
        setText("");
        setImagePreview(null);
        setAudioData(null);
        setFileData(null);
        setFileName("");
        setFileSize(0);
        setShowEmojiPicker(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (fileAttachmentRef.current) fileAttachmentRef.current.value = "";

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

    const handleFileAttachmentChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Max 10MB
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Vui lòng chọn file có dung lượng dưới 10MB");
            return;
        }

        setFileName(file.name);
        setFileSize(file.size);

        const reader = new FileReader();
        reader.onloadend = () => {
            setFileData(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const removeFileAttachment = () => {
        setFileData(null);
        setFileName("");
        setFileSize(0);
        if (fileAttachmentRef.current) fileAttachmentRef.current.value = "";
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    const getTimerShortLabel = (seconds) => {
        if (seconds === 10) return "10s";
        if (seconds === 30) return "30s";
        if (seconds === 60) return "1m";
        if (seconds === 300) return "5m";
        return `${seconds}s`;
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

            {fileData && (
                <div className="max-w-3xl mx-auto mb-3 flex items-center">
                    <div className="relative bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center gap-3 pr-8 shadow-sm">
                        <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-slate-200 truncate max-w-xs sm:max-w-sm">
                                {fileName}
                            </span>
                            <span className="text-xs text-slate-400">
                                {formatBytes(fileSize)}
                            </span>
                        </div>
                        <button
                            onClick={removeFileAttachment}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:bg-red-500 transition-colors"
                            type="button"
                            title="Xóa tệp"
                        >
                            <XIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="w-full max-w-4xl mx-auto flex items-center space-x-1.5 sm:space-x-2">
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
                    className="flex-1 bg-[#121826] border border-slate-800 rounded-xl py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    placeholder="Nhập tin nhắn của bạn..."
                />
                )}

                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                />

                <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"
                    ref={fileAttachmentRef}
                    onChange={handleFileAttachmentChange}
                    className="hidden"
                />

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                        className={`rounded-xl p-2 sm:p-2.5 transition-all flex items-center justify-center border ${
                            showEmojiPicker
                                ? "text-blue-400 bg-blue-500/10 border-blue-500/30"
                                : "bg-[#121826] text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700"
                        }`}
                        disabled={isRecording}
                        title="Chọn biểu tượng cảm xúc"
                    >
                        <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    {showEmojiPicker && (
                        <EmojiPicker
                            onSelectEmoji={handleEmojiSelect}
                            onClose={() => setShowEmojiPicker(false)}
                        />
                    )}
                </div>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowTimerMenu((prev) => !prev)}
                        className={`rounded-xl p-2 sm:px-2.5 sm:py-2.5 transition-all flex items-center justify-center gap-1 text-xs font-medium border ${
                            disappearingOption > 0
                                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                : "bg-[#121826] text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700"
                        }`}
                        disabled={isRecording}
                        title={disappearingOption > 0 ? `Tự hủy sau ${getTimerShortLabel(disappearingOption)}` : "Cài đặt tin nhắn tự hủy"}
                    >
                        <Timer className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        {disappearingOption > 0 && <span>{getTimerShortLabel(disappearingOption)}</span>}
                    </button>

                    {showTimerMenu && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 shadow-xl rounded-xl p-2 z-50 w-36 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                            <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 px-2 py-1 border-b border-slate-700/60">
                                Tin nhắn tự hủy
                            </div>
                            {[
                                { value: 0, label: "Tắt" },
                                { value: 10, label: "10 giây" },
                                { value: 30, label: "30 giây" },
                                { value: 60, label: "1 phút" },
                                { value: 300, label: "5 phút" },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        setDisappearingOption(opt.value);
                                        setShowTimerMenu(false);
                                    }}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                                        disappearingOption === opt.value
                                            ? "bg-amber-500/20 text-amber-400 font-semibold"
                                            : "text-slate-300 hover:bg-slate-700"
                                    }`}
                                >
                                    <span>{opt.label}</span>
                                    {disappearingOption === opt.value && <span className="text-amber-400 font-bold">✓</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => fileAttachmentRef.current?.click()}
                    className={`rounded-xl p-2 sm:p-2.5 transition-all border ${
                        fileData
                            ? "text-blue-400 bg-blue-500/10 border-blue-500/30"
                            : "bg-[#121826] text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700"
                    }`}
                    disabled={isRecording || audioData}
                    title="Gửi tệp đính kèm (PDF, Word, Excel, ZIP...)"
                >
                    <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`rounded-xl p-2 sm:p-2.5 transition-all border ${
                        imagePreview
                            ? "text-blue-400 bg-blue-500/10 border-blue-500/30"
                            : "bg-[#121826] text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700"
                    }`}
                    disabled={isRecording || audioData}
                    title="Gửi hình ảnh"
                >
                    <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {!text.trim() && !imagePreview && !audioData && !fileData && !isRecording ? (
                    <button
                        type="button"
                        onClick={startRecording}
                        className="bg-[#121826] text-slate-400 hover:text-blue-400 border border-slate-800 hover:border-slate-700 rounded-xl p-2 sm:p-2.5 transition-all"
                        title="Ghi âm giọng nói"
                    >
                        <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                ) : (
                    <button
                        type="submit"
                        disabled={(!text.trim() && !imagePreview && !audioData && !fileData) || isRecording}
                        className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 font-medium transition-all shadow-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                        <SendIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                )}
            </form>
        </div>
    );
}
export default MessageInput;