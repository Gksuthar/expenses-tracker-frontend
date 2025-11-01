import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useQuery } from "@tanstack/react-query";
import API from "@/lib/axios-client";
import { TaskType } from "@/types/api.type";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week";

export default function Calendar() {
  const workspaceId = useWorkspaceId();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  // Fetch all tasks for workspace
  const { data: tasksData } = useQuery({
    queryKey: ["calendar-tasks", workspaceId],
    queryFn: async () => {
      const { data } = await API.get(`/task/workspace/${workspaceId}/all?pageSize=1000`);
      return data;
    },
    enabled: !!workspaceId,
  });

  const tasks: TaskType[] = tasksData?.tasks || [];

  // Calendar utility functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get tasks for a specific date
  const getTasksForDate = (day: number) => {
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toDateString();

    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate).toDateString();
      return taskDate === dateStr;
    });
  };

  // Task status colors
  const getTaskColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "bg-blue-500";
      case "IN_PROGRESS":
        return "bg-yellow-500";
      case "DONE":
        return "bg-green-500";
      case "BACKLOG":
        return "bg-gray-500";
      case "IN_REVIEW":
        return "bg-purple-500";
      default:
        return "bg-gray-400";
    }
  };

  // Generate calendar days
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const today = new Date();
  const isToday = (day: number | null) => {
    if (!day) return false;
    return (
      currentDate.getFullYear() === today.getFullYear() &&
      currentDate.getMonth() === today.getMonth() &&
      day === today.getDate()
    );
  };

  return (
    <div className="flex flex-1 flex-col py-4 md:pt-3 pb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendar</h2>
          <p className="text-muted-foreground">View and manage your tasks</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            onClick={() => setViewMode("month")}
          >
            Month
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            onClick={() => setViewMode("week")}
          >
            Week
          </Button>
          <Button onClick={goToToday}>Today</Button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold min-w-[200px] text-center">
            {getMonthName(currentDate)}
          </h3>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Task Status Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>To Do</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Completed</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Task Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-sm text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const dayTasks = day ? getTasksForDate(day) : [];
              const isTodayDate = isToday(day);

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[100px] border rounded-lg p-2 bg-white hover:bg-gray-50 transition-colors",
                    !day && "bg-gray-50",
                    isTodayDate && "border-blue-500 border-2"
                  )}
                >
                  {day && (
                    <>
                      <div
                        className={cn(
                          "text-sm font-medium mb-1",
                          isTodayDate && "text-blue-600 font-bold"
                        )}
                      >
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map((task) => (
                          <div
                            key={task._id}
                            className={cn(
                              "text-xs px-2 py-1 rounded text-white truncate cursor-pointer hover:opacity-80",
                              getTaskColor(task.status)
                            )}
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-xs text-muted-foreground px-2">
                            +{dayTasks.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tasks Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Tasks for {getMonthName(currentDate)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {tasks.filter((t) => t.status === "TODO").length}
              </div>
              <div className="text-sm text-muted-foreground">To Do</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {tasks.filter((t) => t.status === "IN_PROGRESS").length}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {tasks.filter((t) => t.status === "DONE").length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
