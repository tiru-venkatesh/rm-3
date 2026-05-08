import { create } from 'zustand';

export const useAuth = create((set) => ({
  user:    null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
}));

export const useChat = create((set) => ({
  sessions:       [],
  activeChatId:   null,
  messages:       {},
  streaming:      false,

  setSessions:    (sessions) => set({ sessions }),
  setActiveChatId:(id)       => set({ activeChatId: id }),
  setStreaming:   (v)        => set({ streaming: v }),

  setMessages: (id, msgs) =>
    set(s => ({ messages: { ...s.messages, [id]: msgs } })),

  pushMessage: (id, msg) =>
    set(s => ({ messages: { ...s.messages, [id]: [...(s.messages[id] || []), msg] } })),

  appendDelta: (id, delta) =>
    set(s => {
      const msgs = [...(s.messages[id] || [])];
      if (!msgs.length) return s;
      const last = msgs[msgs.length - 1];
      msgs[msgs.length - 1] = { ...last, content: last.content + delta };
      return { messages: { ...s.messages, [id]: msgs } };
    }),

  appendAttachment: (id, attachment) =>
    set(s => {
      const msgs = [...(s.messages[id] || [])];
      if (!msgs.length) return s;
      const last = msgs[msgs.length - 1];
      msgs[msgs.length - 1] = {
        ...last,
        attachments: [...(last.attachments || []), attachment],
      };
      return { messages: { ...s.messages, [id]: msgs } };
    }),
}));
