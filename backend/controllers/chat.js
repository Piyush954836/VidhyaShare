import { supabase } from '../config/supabase.js';

// --- INITIATE A CHAT BETWEEN TWO USERS ---
export const initiateChat = async (req, res) => {
    const initiatorId = req.user.id;
    const { recipientId } = req.body;

    if (!recipientId) return res.status(400).json({ error: "Recipient ID is required." });
    if (initiatorId === recipientId) return res.status(400).json({ error: "You cannot start a chat with yourself." });

    try {
        // Step 1: Check if a chat room already exists.
        const { data: existingRooms, error: rpcError } = await supabase.rpc(
            "find_chat_room_with_users",
            { user_id_1: initiatorId, user_id_2: recipientId }
        );

        if (rpcError) throw rpcError;

        // ✨ UPDATED: RPCs can return an array. Check if it's not empty.
        if (existingRooms && existingRooms.length > 0) {
            return res.status(200).json({ roomId: existingRooms[0].room_id });
        }

        // Step 2: If no room exists, create a new one.
        const { data: newRoom, error: transactionError } = await supabase.rpc(
            "create_chat_room_with_participants",
            { user_id_1: initiatorId, user_id_2: recipientId }
        );

        if (transactionError) throw transactionError;

        // The RPC returns a single row with the ID
        res.status(201).json({ roomId: newRoom.id });

    } catch (err) {
        console.error("[ERROR] Initiating chat:", err);
        res.status(500).json({ error: "Failed to initiate chat." });
    }
};

// --- GET ALL MESSAGES FOR A SPECIFIC CHAT ROOM ---
export const getMessages = async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user.id;
    try {
        const { data: participant, error: participantError } = await supabase
            .from("chat_participants")
            .select("id")
            .eq("room_id", roomId)
            .eq("user_id", userId)
            .single();

        if (participantError || !participant) {
            return res.status(403).json({ error: "You are not a member of this chat room." });
        }

        const { data, error } = await supabase
            .from("chat_messages")
            .select(`id, content, sent_at, sender:profiles (id, full_name)`)
            .eq("room_id", roomId)
            .order("sent_at", { ascending: true });

        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        console.error("[ERROR] Getting messages:", err);
        res.status(500).json({ error: "Failed to retrieve messages." });
    }
};

// --- SEND A NEW MESSAGE TO A CHAT ROOM ---
export const sendMessage = async (req, res) => {
  const { roomId } = req.params;
  const { content } = req.body;
  const sender_id = req.user.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Message content cannot be empty." });
  }

  try {
    // Ensure sender is a participant
    const { data: participant, error: participantError } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", sender_id)
      .single();

    if (participantError || !participant) {
      return res.status(403).json({ error: "You cannot send messages to this chat room." });
    }

    // Insert new chat message
    const { data: messageData, error: messageError } = await supabase
      .from("chat_messages")
      .insert({ room_id: roomId, sender_id, content: content.trim() })
      .select()
      .single();

    if (messageError) throw messageError;

    // ✅ Let Supabase trigger handle notifications automatically
    res.status(201).json({ message: "Message sent", messageData });

  } catch (err) {
    console.error("[ERROR] Sending message:", err);
    res.status(500).json({ error: "Failed to send message." });
  }
};


// --- GET ALL CHAT ROOMS FOR THE LOGGED-IN USER ---
export const getMyChatRooms = async (req, res) => {
    const userId = req.user.id;
    try {
        const { data, error } = await supabase.rpc("get_user_chat_rooms", {
            user_id_input: userId,
        });
        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        console.error("[ERROR] Getting chat rooms:", err);
        res.status(500).json({ error: "Failed to retrieve chat rooms." });
    }
};