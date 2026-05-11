import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { format } from "date-fns";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  photoURL: string | null;
  createdAt: Timestamp | null;
}

export default function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log("ChatModal rendering, isOpen:", isOpen, "user:", user ? user.uid : 'null');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    if (!isOpen || !user) return;

    const q = query(
      collection(db, "messages"),
      orderBy("createdAt", "desc"),
      limit(50),
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() } as Message);
        });
        setMessages(msgs.reverse());
      },
      (error) => {
        console.error(
          "Firestore Error: ",
          JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            operationType: "list",
            path: "messages",
          }),
        );
      },
    );

    return unsub;
  }, [isOpen, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in failed", error);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, "messages"), {
        text: newMessage,
        userId: user.uid,
        userName: user.displayName || "Unknown Person",
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error(
        "Firestore Error: ",
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          operationType: "create",
          path: "messages",
        }),
      );
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    try {
      if (typeof timestamp.toDate === 'function') {
        return format(timestamp.toDate(), "h:mm a");
      }
      return format(new Date(timestamp), "h:mm a");
    } catch(e) {
      return "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300 pointer-events-auto">
      <div className="bg-gray-900/80 backdrop-blur-3xl border border-white/10 rounded-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 flex-shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Global Chat
          </h2>
          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={handleSignOut}
                className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
                title="Sign out of chat"
              >
                Sign Out
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 px-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
              title="Close Chat"
            >
              Close
            </button>
          </div>
        </div>

        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-xl text-white font-bold mb-2">
              Join the Conversation
            </h3>
            <p className="text-gray-400 mb-6 max-w-sm text-balance">
              Sign in with Google to start talking with people in the Global Chat.
            </p>
            <button
              onClick={handleSignIn}
              className="bg-white text-gray-900 hover:bg-gray-200 font-bold py-3 px-6 rounded-lg transition-transform hover:scale-105 active:scale-95 shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-black/20">
            <div className="flex-1 p-4 overflow-y-auto min-h-0 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  Be the first to say hello!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.userId === user.uid;
                  return (
                    <div
                      key={msg.id}
                      className={`flex w-full ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] sm:max-w-[65%] flex flex-col ${
                          isMe ? "items-end" : "items-start"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1 px-1">
                          {!isMe && msg.photoURL && (
                            <img
                              src={msg.photoURL}
                              alt="avatar"
                              className="w-4 h-4 rounded-full opacity-80"
                            />
                          )}
                          <span className="text-[10px] text-gray-400 font-medium">
                            {isMe ? "You" : msg.userName}
                          </span>
                          <span className="text-[9px] text-gray-500">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
                            isMe
                              ? "bg-blue-600 text-white rounded-tr-sm"
                              : "bg-white/10 text-gray-100 rounded-tl-sm border border-white/5"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white/5 border-t border-white/10 flex-shrink-0 flex gap-2"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-black/40 text-white placeholder-gray-400 border border-white/10 rounded-full py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-2.5 aspect-square flex items-center justify-center transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 -ml-0.5"
                >
                  <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
