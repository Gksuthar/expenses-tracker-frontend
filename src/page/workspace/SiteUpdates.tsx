import { useState } from "react";
import { CheckCircle, Upload, X, Image as ImageIcon, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useQuery, useMutation } from "@tanstack/react-query";
import API from "@/lib/axios-client";
import { TaskType } from "@/types/api.type";

interface SiteUpdate {
  _id: string;
  task: TaskType;
  completionNotes: string;
  photos: string[];
  createdAt: string;
  createdBy: {
    name: string;
    profilePicture: string | null;
  };
}

const SiteUpdates = () => {
  const workspaceId = useWorkspaceId();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);

  // Fetch completed tasks
  const { data: tasksData } = useQuery({
    queryKey: ["completed-tasks", workspaceId],
    queryFn: async () => {
      const { data } = await API.get(`/task/workspace/${workspaceId}/all?pageSize=1000`);
      return data;
    },
    enabled: !!workspaceId,
  });

  // Fetch site updates from API
  const { data: siteUpdatesData } = useQuery({
    queryKey: ["site-updates", workspaceId],
    queryFn: async () => {
      const { data } = await API.get(`/site-update/workspace/${workspaceId}/all`);
      return data;
    },
    enabled: !!workspaceId,
  });

  // Create site update mutation
  const createSiteUpdateMutation = useMutation({
    mutationFn: async (data: { taskId: string; completionNotes: string; photos: string[] }) => {
      const response = await API.post(`/site-update/workspace/${workspaceId}/create`, data);
      return response.data;
    },
    onSuccess: () => {
      setSelectedTask("");
      setCompletionNotes("");
      setPhotos([]);
      setPhotosPreviews([]);
      setIsDialogOpen(false);
    },
  });

  const siteUpdates: SiteUpdate[] = siteUpdatesData?.siteUpdates || [];

  const tasks: TaskType[] = tasksData?.tasks || [];
  // Show all tasks instead of just completed ones
  const completedTasks = tasks;

  // Handle photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 5) {
      alert("Maximum 5 photos allowed");
      return;
    }

    setPhotos([...photos, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotosPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotosPreviews(photosPreviews.filter((_, i) => i !== index));
  };

  // Submit site update
  const handleSubmit = () => {
    if (!selectedTask || !completionNotes) {
      alert("Please select a task and add completion notes");
      return;
    }

    createSiteUpdateMutation.mutate({
      taskId: selectedTask,
      completionNotes,
      photos: photosPreviews, // In production, upload photos first and get URLs
    });
  };

  return (
    <div className="flex flex-1 flex-col py-4 md:pt-3 pb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Site Updates</h2>
          <p className="text-muted-foreground">Task completion updates will appear here</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Add Update
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Site Update</DialogTitle>
              <p className="text-sm text-muted-foreground">Record task completion with proof of work</p>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Task Selection */}
              <div className="space-y-2">
                <Label>Task</Label>
                <Select value={selectedTask} onValueChange={setSelectedTask}>
                  <SelectTrigger>
                    <SelectValue placeholder={completedTasks.length > 0 ? "Select task" : "No tasks available"} />
                  </SelectTrigger>
                  <SelectContent>
                    {completedTasks.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        No tasks found. Please create a task first.
                      </div>
                    ) : (
                      completedTasks.map((task) => (
                        <SelectItem key={task._id} value={task._id}>
                          {task.taskCode} - {task.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {completedTasks.length > 0 && (
                  <p className="text-xs text-muted-foreground">{completedTasks.length} task(s) available</p>
                )}
              </div>

              {/* Completion Notes */}
              <div className="space-y-2">
                <Label>Completion Notes</Label>
                <Textarea
                  placeholder="Describe the work completed..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Proof of Completion</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Add Photo (Demo)</p>
                    <p className="text-xs text-gray-400 mt-1">Maximum 5 photos</p>
                  </label>
                </div>

                {/* Photo Previews */}
                {photosPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {photosPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Add Update</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* About Site Updates */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2 text-blue-600">About Site Updates</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Record task completions with photographic evidence</li>
            <li>• Track project progress with detailed completion notes</li>
            <li>• Maintain a chronological history of all site activities</li>
            <li>• Share updates with stakeholders and team members</li>
          </ul>
        </CardContent>
      </Card>

      {/* Site Updates List */}
      {siteUpdates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Site Updates</h3>
            <p className="text-muted-foreground text-center mb-4">
              Task completion updates will appear here
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Add First Update
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {siteUpdates.map((update) => (
            <Card key={update._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {update.task.taskCode} - {update.task.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(update.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <span>by {update.createdBy.name}</span>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Completed
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Completion Notes */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Completion Notes:</h4>
                    <p className="text-sm text-muted-foreground">{update.completionNotes}</p>
                  </div>

                  {/* Photos */}
                  {update.photos.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Proof of Completion:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {update.photos.map((photo, index) => (
                          <div key={index} className="relative group cursor-pointer">
                            <img
                              src={photo}
                              alt={`Completion proof ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <span className="text-white text-sm">View Full Size</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        Failed to load site updates (Backend API not yet implemented)
      </div>
    </div>
  );
};

export default SiteUpdates;
