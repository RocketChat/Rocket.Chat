// For just making a notice
// meteorhacks:kadira-profiler will override this method to add
// actual functionality
Kadira.profileCpu = function profileCpu() {
  var message =
    "Please install meteorhacks:kadira-profiler" +
    " to take a CPU profile.";
  console.log(message);
};