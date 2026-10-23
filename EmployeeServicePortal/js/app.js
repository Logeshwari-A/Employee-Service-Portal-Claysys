
const API_URL = "http://localhost:5000/api/ServiceRequests";

let requests = [];
let currentPage = "new";
let isSubmitting = false;

const $ = (selector) => document.querySelector(selector);

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function toast(message) {
    const element = $("#toast");
    if (!element) return;

    element.textContent = message;
    element.classList.add("show");

    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
        element.classList.remove("show");
    }, 3000);
}

function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(
        String(value).length === 10 ? `${value}T00:00:00` : value
    );

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function getRadioValue(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function getBusinessImpact() {
    return getRadioValue("impact");
}

function getUrgency() {
    return getRadioValue("urgency");
}

function getPriorityClass(priority) {
    const value = String(priority || "").toUpperCase();

    if (value === "HIGH") return "high";
    if (value === "NORMAL" || value === "MEDIUM") return "medium";

    return "low";
}

function getStatusClass(status) {
    const value = String(status || "").toUpperCase();

    if (value === "APPROVED") return "approved";
    if (value === "REJECTED") return "rejected";

    return "";
}

function updateSummary() {
    const title = $("#title").value.trim();
    const description = $("#description").value.trim();
    const category = $("#category").value;
    const asset = $("#asset").value.trim();
    const priority = $("#priority").value;

    $("#sum-title").textContent = title || "Untitled request";
    $("#sum-category").textContent = category || "Not selected";
    $("#sum-asset").textContent = asset || "Not provided";
    $("#sum-description").textContent =
        description || "Your description will appear here.";

    $("#sum-priority").textContent = priority || "Not selected";
    $("#sum-priority").className =
        `priority ${priority ? getPriorityClass(priority) : ""}`;

    $("#sum-date").textContent = formatDate($("#target").value);
    $("#count").textContent = `${description.length} / 1000`;

    $("#asset-help").textContent =
        category === "Hardware"
            ? "Required for hardware requests."
            : "Optional for this category.";
}

function clearErrors() {
    document.querySelectorAll(".error").forEach((element) => {
        element.textContent = "";
    });

    document.querySelectorAll(".invalid").forEach((element) => {
        element.classList.remove("invalid");
    });
}

function showError(fieldId, errorId, message) {
    const field = $(`#${fieldId}`);
    const error = $(`#${errorId}`);

    if (field) field.classList.add("invalid");
    if (error) error.textContent = message;
}

function validateForm() {
    clearErrors();
    let valid = true;

    const title = $("#title").value.trim();
    const description = $("#description").value.trim();
    const category = $("#category").value;
    const priority = $("#priority").value;
    const targetDate = $("#target").value;
    const asset = $("#asset").value.trim();

    if (!title) {
        showError("title", "title-error", "Enter a request title.");
        valid = false;
    } else if (title.length > 150) {
        showError("title", "title-error", "Title cannot exceed 150 characters.");
        valid = false;
    }

    if (!description) {
        showError("description", "description-error", "Enter a description.");
        valid = false;
    } else if (description.length > 1000) {
        showError(
            "description",
            "description-error",
            "Description cannot exceed 1000 characters."
        );
        valid = false;
    }

    if (!category) {
        showError("category", "category-error", "Select a category.");
        valid = false;
    }

    if (category === "Hardware" && !asset) {
        showError(
            "asset",
            "asset-error",
            "Enter the asset tag for hardware requests."
        );
        valid = false;
    }

    if (!getBusinessImpact()) {
        $("#impact-error").textContent = "Select the business impact.";
        valid = false;
    }

    if (!getUrgency()) {
        $("#urgency-error").textContent = "Select the urgency.";
        valid = false;
    }

    if (!priority) {
        showError("priority", "priority-error", "Select a priority.");
        valid = false;
    }

    if (!targetDate) {
        showError("target", "target-error", "Choose a target date.");
        valid = false;
    } else if (targetDate < localDateString()) {
        showError("target", "target-error", "Target date cannot be in the past.");
        valid = false;
    }

    if (!valid) {
        toast("Please correct the highlighted fields.");
    }

    return valid;
}

function getFormData() {
    return {
        requestTitle: $("#title").value.trim(),
        description: $("#description").value.trim(),
        category: $("#category").value,
        assetTag: $("#asset").value.trim() || null,
        businessImpact: getBusinessImpact(),
        urgency: getUrgency(),
        priority: $("#priority").value || "LOW",
        targetDate: $("#target").value || null,
        requesterName: "Logeshwari"
    };
}

function showPage(page) {
    const pages = {
        new: "#new-page",
        mine: "#mine-page",
        approval: "#approval-page",
        reports: "#reports-page"
    };

    if (!pages[page]) return;

    currentPage = page;

    Object.entries(pages).forEach(([key, selector]) => {
        $(selector).classList.toggle("hidden", key !== page);
    });

    document.querySelectorAll(".nav").forEach((button) => {
        button.classList.toggle("active", button.dataset.page === page);
    });

    const titles = {
        new: ["New request", "Create a service request"],
        mine: ["My requests", "My service requests"],
        approval: ["Approval queue", "Review service requests"],
        reports: ["Reports", "Service request reports"]
    };

    $("#crumb").textContent = titles[page][0];
    $("#page-title").textContent = titles[page][1];

    if (page === "mine" || page === "approval" || page === "reports" || page === "new") {
        loadRequests(page !== "new");
    }
}

function setStep(stepNumber) {
    document.querySelectorAll(".step").forEach((step) => {
        const number = Number(step.dataset.step);

        step.classList.toggle("current", number === stepNumber);
        step.classList.toggle("complete", number < stepNumber);
    });

    $("#step-label").textContent = `STEP ${stepNumber} OF 3`;
}

function showReview() {
    if (!validateForm()) return;

    const data = getFormData();

    const rows = [
        ["Title", data.requestTitle],
        ["Description", data.description],
        ["Category", data.category],
        ["Asset tag", data.assetTag || "Not provided"],
        ["Business impact", data.businessImpact],
        ["Urgency", data.urgency],
        ["Priority", data.priority],
        ["Target date", formatDate(data.targetDate)]
    ];

    $("#review-list").innerHTML = rows.map(([label, value]) => `
        <div>
            <dt>${escapeHTML(label)}</dt>
            <dd>${escapeHTML(value)}</dd>
        </div>
    `).join("");

    $("#details").classList.add("hidden");
    $("#review-panel").classList.remove("hidden");
    $("#confirmation").classList.add("hidden");

    setStep(2);
}

async function postRequest(path, data) {
    const response = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed: HTTP ${response.status}`);
    }

    return response.json();
}

async function submitRequest() {
    if (isSubmitting || !validateForm()) return;

    isSubmitting = true;
    $("#review-submit").disabled = true;

    try {
        const formData = getFormData();
        let saved;

        try {
            saved = await postRequest("", formData);
        } catch (error) {
            if (!(error instanceof TypeError)) {
                throw error;
            }

            const nextRequestID = requests.reduce(
                (maximum, request) => Math.max(maximum, Number(request.requestID) || 0),
                0
            ) + 1;

            saved = {
                requestID: nextRequestID,
                localOnly: true
            };

            requests.unshift({
                ...formData,
                requestID: nextRequestID,
                id: "SR-" + String(nextRequestID).padStart(4, "0"),
                title: formData.requestTitle,
                assetTag: formData.assetTag || "",
                targetDate: formData.targetDate || "",
                status: "Pending",
                requesterName: formData.requesterName
            });
        }

        $("#request-id").textContent =
            "SR-" + String(saved.requestID).padStart(4, "0");

        $("#confirmation").classList.remove("hidden");
        $("#review-panel").classList.add("hidden");
        $("#details").classList.add("hidden");

        $("#confirmation p").textContent =
            "Your request has been saved and is awaiting approval.";

        $("#draft").textContent = "SUBMITTED";

        setStep(3);
        if (saved.localOnly) {
            renderLists();
            toast("Request submitted in this browser session.");
        } else {
            await loadRequests();
            toast("Request submitted successfully.");
        }
    } catch (error) {
        console.error("Submit error:", error);
        toast("Unable to submit. Check that the API is running.");
    } finally {
        isSubmitting = false;
        $("#review-submit").disabled = false;
    }
}

async function saveDraft() {
    if (isSubmitting) return;

    isSubmitting = true;
    $("#save-draft").disabled = true;

    try {
        const saved = await postRequest("/draft", getFormData());

        $("#request-id").textContent =
            "SR-" + String(saved.requestID).padStart(4, "0");

        $("#draft").textContent = "DRAFT";

        await loadRequests();
        toast(`Draft saved as SR-${String(saved.requestID).padStart(4, "0")}.`);
    } catch (error) {
        console.error("Save draft error:", error);
        toast("Unable to save the draft. Check that the API is running.");
    } finally {
        isSubmitting = false;
        $("#save-draft").disabled = false;
    }
}

async function loadRequests(showUnavailableMessage = true) {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        requests = data.map((item) => ({
            requestID: item.requestID,
            id: "SR-" + String(item.requestID).padStart(4, "0"),
            title: item.requestTitle || "",
            description: item.description || "",
            category: item.category || "",
            assetTag: item.assetTag || "",
            priority: (item.priority || "LOW").toUpperCase(),
            targetDate: item.targetDate || "",
            status: item.status || "Pending",
            requesterName: item.requesterName || "Logeshwari",
            createdAt: item.createdAt
        }));

        renderLists();
    } catch (error) {
        console.error("Load requests error:", error);
        if (showUnavailableMessage) {
            toast("Could not load requests. Check that the API is running.");
        }
    }
}

function renderLists() {
    const mineBody = $("#mine-body");
    const approvalBody = $("#approval-body");
    const recentBody = $("#recent-body");

    mineBody.innerHTML = requests.map((request) => `
        <tr>
            <td>${escapeHTML(request.id)}</td>
            <td>${escapeHTML(request.title || "(Untitled draft)")}</td>
            <td>${escapeHTML(request.category || "—")}</td>
            <td>
                <span class="priority ${getPriorityClass(request.priority)}">
                    ${escapeHTML(request.priority)}
                </span>
            </td>
            <td>${escapeHTML(formatDate(request.targetDate))}</td>
            <td>
                <span class="status ${getStatusClass(request.status)}">
                    ${escapeHTML(request.status)}
                </span>
            </td>
        </tr>
    `).join("");

    $("#mine-empty").classList.toggle("hidden", requests.length > 0);
    mineBody.closest("table").classList.toggle("hidden", requests.length === 0);

    const pendingRequests = requests.filter((request) =>
        ["PENDING", "PENDING APPROVAL", "PENDING APPROVAL "]
            .includes(request.status.toUpperCase())
    );

    approvalBody.innerHTML = pendingRequests.map((request) => `
        <tr>
            <td>${escapeHTML(request.id)}</td>
            <td>${escapeHTML(request.title || "(Untitled draft)")}</td>
            <td>${escapeHTML(request.requesterName)}</td>
            <td>
                <span class="priority ${getPriorityClass(request.priority)}">
                    ${escapeHTML(request.priority)}
                </span>
            </td>
            <td>${escapeHTML(request.status)}</td>
            <td>
                <button type="button" class="primary"
                    data-action="approve" data-id="${request.requestID}">
                    Approve
                </button>
                <button type="button" class="secondary"
                    data-action="reject" data-id="${request.requestID}">
                    Reject
                </button>
            </td>
        </tr>
    `).join("");

    $("#approval-empty").classList.toggle("hidden", pendingRequests.length > 0);
    approvalBody.closest("table").classList.toggle("hidden", pendingRequests.length === 0);

    const recentRequests = requests.slice(0, 5);

    recentBody.innerHTML = recentRequests.map((request) => `
        <tr>
            <td>
                <strong>${escapeHTML(request.id)}</strong>
                <small>${escapeHTML(request.title || "(Untitled draft)")}</small>
            </td>
            <td>${escapeHTML(request.category || "—")}</td>
            <td>
                <span class="priority ${getPriorityClass(request.priority)}">
                    ${escapeHTML(request.priority)}
                </span>
            </td>
            <td>
                <span class="status ${getStatusClass(request.status)}">
                    ${escapeHTML(request.status)}
                </span>
            </td>
            <td>${escapeHTML(formatDate(request.targetDate))}</td>
        </tr>
    `).join("");

    $("#recent-empty").classList.toggle("hidden", recentRequests.length > 0);
    recentBody.closest("table").classList.toggle("hidden", recentRequests.length === 0);

    $("#total").textContent = requests.length;
    $("#pending").textContent = pendingRequests.length;
    $("#high").textContent =
        requests.filter((request) => request.priority === "HIGH").length;
    $("#resolved").textContent =
        requests.filter((request) => request.status.toUpperCase() === "APPROVED").length;

    const counts = {};

    requests.forEach((request) => {
        const category = request.category || "Uncategorized";
        counts[category] = (counts[category] || 0) + 1;
    });

    const maxCount = Math.max(1, ...Object.values(counts));

    $("#category-report").innerHTML = Object.keys(counts).length
        ? Object.entries(counts).map(([category, count]) => `
            <div class="category-row">
                <span>${escapeHTML(category)}</span>
                <div class="bar">
                    <span style="width:${count / maxCount * 100}%"></span>
                </div>
                <strong>${count}</strong>
            </div>
        `).join("")
        : '<p class="empty">No saved requests found.</p>';
}

async function updateRequestStatus(id, action) {
    if (!["approve", "reject"].includes(action)) return;

    const label = action === "approve" ? "approve" : "reject";

    if (!confirm(`Are you sure you want to ${label} request SR-${String(id).padStart(4, "0")}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}/${action}`, {
            method: "PUT"
        });

        if (!response.ok) {
            throw new Error(await response.text() || `HTTP ${response.status}`);
        }

        toast(`Request ${label}d successfully.`);
        await loadRequests();
    } catch (error) {
        console.error("Status update error:", error);
        toast("Unable to update status. Check the API.");
    }
}

function resetForm() {
    HTMLFormElement.prototype.reset.call($("#request-form"));

    $("#details").classList.remove("hidden");
    $("#review-panel").classList.add("hidden");
    $("#confirmation").classList.add("hidden");

    $("#draft").textContent = "DRAFT";
    $("#request-id").textContent = "";

    clearErrors();
    updateSummary();
    setStep(1);
}

document.addEventListener("DOMContentLoaded", () => {
    // Minimum selectable target date is today.
    $("#target").min = localDateString();

    document.querySelectorAll(".nav[data-page]").forEach((button) => {
        button.addEventListener("click", () => showPage(button.dataset.page));
    });

    $("#submit").addEventListener("click", showReview);
    $("#review-submit").addEventListener("click", submitRequest);
    $("#save-draft").addEventListener("click", saveDraft);

    $("#back").addEventListener("click", () => {
        $("#details").classList.remove("hidden");
        $("#review-panel").classList.add("hidden");
        setStep(1);
    });

    $("#reset").addEventListener("click", resetForm);

    $("#another").addEventListener("click", () => {
        resetForm();
        showPage("new");
    });

    $("#view-mine").addEventListener("click", () => showPage("mine"));
    $("#view-all-requests").addEventListener("click", () => showPage("mine"));

    $("#new-from-list").addEventListener("click", () => {
        resetForm();
        showPage("new");
    });

    $("#approval-body").addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        updateRequestStatus(button.dataset.id, button.dataset.action);
    });

    ["title", "description", "category", "asset", "priority", "target"].forEach((id) => {
        $(`#${id}`).addEventListener("input", updateSummary);
        $(`#${id}`).addEventListener("change", updateSummary);
    });

    document.querySelectorAll('input[name="impact"], input[name="urgency"]')
        .forEach((radio) => {
            radio.addEventListener("change", updateSummary);
        });

    updateSummary();
    setStep(1);
    showPage("new");
});
