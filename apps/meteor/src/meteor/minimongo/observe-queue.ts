export class ObserveQueue {
  private tasks: Array<() => void> = [];

  queueTask(task: () => void) {
    this.tasks.push(task);
  }

  drain(): void {
    const currentTasks = this.tasks;
    this.tasks = [];
    for (const task of currentTasks) {
      task();
    }
  }
}