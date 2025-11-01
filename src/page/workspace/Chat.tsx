import { useState } from "react";
import { Send, Settings, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "@/lib/axios-client";

interface ChatRoom {
  _id: string;
  name: string;
  description: string;
  icon: string;
  type: "channel" | "project";
}

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    profilePicture: string | null;
  };
  content: string;
  createdAt: string;
}

export default function Chat() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messageInput, setMessageInput] = useState("");
  
  // Create chat room dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [roomIcon, setRoomIcon] = useState("💬");
  const [roomType, setRoomType] = useState<"channel" | "project">("channel");

  // Fetch chat rooms
  const { data: chatRoomsData } = useQuery({
    queryKey: ["chat-rooms", workspaceId],
    queryFn: async () => {
      const { data } = await API.get(`/chat/workspace/${workspaceId}/all`);
      return data;
    },
    enabled: !!workspaceId,
  });

  // Fetch messages for selected room
  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ["chat-messages", selectedRoom?._id],
    queryFn: async () => {
      const { data } = await API.get(
        `/chat/room/${selectedRoom?._id}/workspace/${workspaceId}/messages`
      );
      return data;
    },
    enabled: !!selectedRoom?._id && !!workspaceId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await API.post(
        `/chat/room/${selectedRoom?._id}/workspace/${workspaceId}/message`,
        { content }
      );
      return data;
    },
    onSuccess: () => {
      refetchMessages();
      setMessageInput("");
    },
  });

  // Create chat room mutation
  const createChatRoomMutation = useMutation({
    mutationFn: async (roomData: {
      name: string;
      description: string;
      icon: string;
      type: "channel" | "project";
    }) => {
      const { data } = await API.post(
        `/chat/workspace/${workspaceId}/create`,
        roomData
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chat-rooms", workspaceId] });
      setIsCreateDialogOpen(false);
      setRoomName("");
      setRoomDescription("");
      setRoomIcon("💬");
      setRoomType("channel");
      // Auto-select the newly created room
      if (data?.chatRoom) {
        setSelectedRoom(data.chatRoom);
      }
    },
  });

  const handleCreateRoom = () => {
    if (!roomName.trim()) return;
    createChatRoomMutation.mutate({
      name: roomName,
      description: roomDescription,
      icon: roomIcon,
      type: roomType,
    });
  };

  const chatRooms: ChatRoom[] = chatRoomsData?.chatRooms || [];
  const messages: Message[] = messagesData?.messages || [];

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedRoom) return;
    sendMessageMutation.mutate(messageInput);
  };

  return (
    <div className="flex flex-1 flex-col py-4 md:pt-3 pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Team Chat</h2>
        <p className="text-muted-foreground">Communicate with your team in real-time</p>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1">
        {/* Chat Rooms Sidebar */}
        <Card className="col-span-12 md:col-span-3">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center justify-between">
              <span>Chat Rooms</span>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Chat Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="room-name">Room Name *</Label>
                      <Input
                        id="room-name"
                        placeholder="Enter room name"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="room-description">Description</Label>
                      <Textarea
                        id="room-description"
                        placeholder="Enter room description (optional)"
                        value={roomDescription}
                        onChange={(e) => setRoomDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="room-icon">Icon</Label>
                      <Input
                        id="room-icon"
                        placeholder="Enter emoji or icon"
                        value={roomIcon}
                        onChange={(e) => setRoomIcon(e.target.value)}
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="room-type">Room Type</Label>
                      <Select value={roomType} onValueChange={(value: "channel" | "project") => setRoomType(value)}>
                        <SelectTrigger id="room-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="channel">Channel</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateRoom}
                      disabled={!roomName.trim() || createChatRoomMutation.isPending}
                    >
                      {createChatRoomMutation.isPending ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Select a room to join</p>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="p-2">
              {chatRooms.map((room) => (
                <button
                  key={room._id}
                  onClick={() => setSelectedRoom(room)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg mb-1 transition-colors hover:bg-gray-100",
                    selectedRoom?._id === room._id && "bg-blue-50 hover:bg-blue-100"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-lg">{room.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{room.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {room.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Messages Area */}
        <Card className="col-span-12 md:col-span-9 flex flex-col">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{selectedRoom.icon}</div>
                    <div>
                      <h3 className="font-semibold">{selectedRoom.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedRoom.description}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message._id} className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                          {message.sender.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-sm">
                            {message.sender.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.createdAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder={`Message ${selectedRoom.name}...`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift + Enter for new line
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Be the first to start the conversation in Site A
              </p>
              <div className="w-full max-w-md space-y-3">
                <div className="text-left">
                  <p className="text-sm font-medium mb-2">Quick Start Tips:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Select a chat room from the left sidebar</li>
                    <li>• Start conversations with your team members</li>
                    <li>• Share updates and coordinate work efficiently</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Info Footer */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Made with Emergent • Real-time chat backend not yet implemented
      </div>
    </div>
  );
}
