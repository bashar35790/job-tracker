/**
 * Job Tracker Application Logic - Refactored
 * Modular, performant, state-driven architecture.
 */
document.addEventListener("DOMContentLoaded", () => {
  // 1. STATE MANAGEMENT
  const state = {
    currentTab: "All", // Tracks active tab: 'All', 'Interview', 'Rejected'
    jobs: [], // Holds references to job DOM elements and their status
  };

  // 2. DOM SELECTORS (Cached for performance)
  const DOM = {
    container: document.querySelector(".all-job"),
    tabs: document.querySelector("#tab-buttons"),
    tabButtons: document.querySelectorAll("#tab-buttons button"),
    countMsg: document.querySelector("#job-count"),
    dashboard: {
      Total: null,
      Interview: null,
      Rejected: null,
    },
  };

  // Initialize dashboard elements dynamically ensuring robustness
  document.querySelectorAll("#dasbord-cards .flex-1").forEach((card) => {
    const title = card.querySelector("h3").textContent.trim();
    DOM.dashboard[title] = card.querySelector("p");
  });

  // 3. INITIALIZATION
  function init() {
    // Collect job elements into state to avoid repeated DOM queries
    const jobElements = DOM.container.querySelectorAll(".job-item");
    jobElements.forEach((el) => {
      state.jobs.push({
        element: el,
        status: "none", // Initial generic status: 'none', 'Interview', or 'Rejected'
      });
      el.dataset.status = "none"; // Sync DOM dataset
    });

    setupEventListeners();
    updateUI();
  }

  // 4. CORE LOGIC & UI UPDATES

  /**
   * Updates the dashboard statistical counts based on the current state.
   */
  function updateDashboardCounts() {
    const counts = { Total: state.jobs.length, Interview: 0, Rejected: 0 };

    state.jobs.forEach((job) => {
      if (job.status === "Interview") counts.Interview++;
      if (job.status === "Rejected") counts.Rejected++;
    });

    // Update top-level dashboard values
    if (DOM.dashboard.Total) DOM.dashboard.Total.textContent = counts.Total;
    if (DOM.dashboard.Interview)
      DOM.dashboard.Interview.textContent = counts.Interview;
    if (DOM.dashboard.Rejected)
      DOM.dashboard.Rejected.textContent = counts.Rejected;
  }

  /**
   * Renders the job list visibility based on the active tab and job status.
   */
  function renderJobs() {
    let visibleCount = 0;

    state.jobs.forEach((job) => {
      // Determine if the job matches the correct tab rendering logic
      const isVisible =
        (state.currentTab === "All" && job.status === "none") ||
        state.currentTab === job.status;

      // Toggle element display
      job.element.style.display = isVisible ? "block" : "none";
      if (isVisible) visibleCount++;
    });

    // Update textual amount shown on the right side above the tabs
    if (DOM.countMsg) DOM.countMsg.textContent = `${visibleCount} jobs`;

    // Check if we need to show the empty fallback message
    toggleEmptyState(visibleCount);
  }

  /**
   * Shows or hides the "No Jobs available" empty state message.
   */
  function toggleEmptyState(visibleCount) {
    let emptyUI = DOM.container.querySelector(".no-jobs-msg");

    // Show empty state if nothing is visible
    if (visibleCount === 0) {
      if (!emptyUI) {
        // Build it once if it's not present
        emptyUI = document.createElement("div");
        emptyUI.className =
          "no-jobs-msg flex flex-col items-center justify-center py-10 text-center space-y-4";
        emptyUI.innerHTML = `
                    <img src="jobs.png" alt="empty" class="w-24 h-24">
                    <h3 class="text-2xl font-semibold text-[#002C5C]">No jobs available</h3>
                    <p class="text-[16px] text-[#64748B]">There are currently no jobs under this category.</p>
                `;
        DOM.container.appendChild(emptyUI);
      }
      emptyUI.style.display = "flex";
    } else if (emptyUI) {
      // Hide it if we have readable jobs
      emptyUI.style.display = "none";
    }
  }

  /**
   * Master function coordinating all UI component updates.
   */
  function updateUI() {
    updateDashboardCounts();
    renderJobs();
  }

  // 5. EVENT HANDLERS

  /**
   * Handles tab switching aesthetics and state triggers.
   */
  function handleTabClick(e) {
    if (e.target.tagName !== "BUTTON") return;

    // Reset active selection class from all tab buttons
    DOM.tabButtons.forEach((btn) => {
      btn.classList.remove("bg-[#3B82F6]", "text-white");
      btn.classList.add("btn-soft"); // Fallback design
    });

    // Emphasize the active button
    e.target.classList.remove("btn-soft");
    e.target.classList.add("bg-[#3B82F6]", "text-white");

    // Update active tab state and trigger only jobs re-render (dashboard hasn't changed)
    state.currentTab = e.target.textContent.trim();
    renderJobs();
  }

  /**
   * Handles specific interactions inside the job cards (delete, status).
   */
  function handleJobAction(e) {
    // Prevent action if not originated within a configured job wrapper
    const jobEl = e.target.closest(".job-item");
    if (!jobEl) return;

    // Find associated job index in state tracking array
    const jobIndex = state.jobs.findIndex((j) => j.element === jobEl);
    if (jobIndex === -1) return;

    // --- A. Delete Action ---
    const isDeleteAction =
      e.target.closest(".fa-trash") ||
      e.target.closest("div.border.rounded-full");
    if (isDeleteAction) {
      deleteJob(jobIndex);
      return;
    }

    // --- B. Status Interaction ---
    if (e.target.tagName === "BUTTON") {
      const btnText = e.target.textContent.trim().toLowerCase();

      if (btnText === "interview" || btnText === "rejected") {
        updateJobStatus(jobIndex, btnText);
      }
    }
  }

  /**
   * Logic for deleting a job block from state and the physical DOM.
   */
  function deleteJob(index) {
    // Remove from DOM
    state.jobs[index].element.remove();
    // Remove from state array
    state.jobs.splice(index, 1);

    // Re-process UI based on latest data
    updateUI();
  }

  /**
   * Logic for transitioning a job into Interview or Rejected status.
   */
  function updateJobStatus(index, newStatusLabel) {
    const job = state.jobs[index];
    const newStatus = newStatusLabel === "interview" ? "Interview" : "Rejected";

    // Update local object & node tracker
    job.status = newStatus;
    job.element.dataset.status = newStatus;

    // Locate wrapper indicating "Not Applied" initially (3rd div node block)
    const wrapper = job.element.children[2];
    const badgeBtn = wrapper ? wrapper.querySelector("button") : null;

    if (badgeBtn) {
      // Apply corresponding label text
      badgeBtn.textContent = newStatus;

      // Adjust to designated brand colors
      badgeBtn.className =
        newStatus === "Interview"
          ? "btn btn-soft bg-[#10B981] text-white border-none w-max px-4" // Green
          : "btn btn-soft bg-[#EF4444] text-white border-none w-max px-4"; // Red
    }

    updateUI();
  }

  /**
   * Boots Event Listeners through event delegation paradigm.
   */
  function setupEventListeners() {
    DOM.tabs.addEventListener("click", handleTabClick);
    DOM.container.addEventListener("click", handleJobAction);
  }

  // 6. START APPLICATION LAUNCHER
  init();
});
