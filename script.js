document.addEventListener("DOMContentLoaded", () => {

    const taskInput = document.getElementById("task-input");
    const taskList = document.getElementById("task-list");
    const emptyImage = document.querySelector(".empty-image");

    const progressFill = document.querySelector(".progress-fill");
    const progressText = document.querySelector(".progress-text");

    const canvas = document.getElementById("confetti-canvas");
    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);


    let confettiParticles = [];

    function toggleEmptyState() {
        emptyImage.style.display = taskList.children.length === 0 ? "block" : "none";
    }

    function updateProgress() {
        const total = taskList.children.length;
        const completed = document.querySelectorAll("#task-list li.completed").length;

        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        progressFill.style.width = percent + "%";
        progressText.textContent = `${percent}% completed`;

        if (percent === 100 && total > 0) {
            startConfetti();
        }
    }

    function addTask(text) {
        if (!text.trim()) return;

        const li = document.createElement("li");

        li.innerHTML = `
            <input type="checkbox" class="checkbox">
            <span>${text}</span>
            <div class="task-buttons">
                <button class="edit-btn"><i class="fa-solid fa-pen"></i></button>
                <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;

        const checkbox = li.querySelector(".checkbox");
        const editBtn = li.querySelector(".edit-btn");

        checkbox.addEventListener("change", () => {
            li.classList.toggle("completed", checkbox.checked);
            editBtn.disabled = checkbox.checked;
            updateProgress();
        });

        editBtn.addEventListener("click", () => {
            taskInput.value = li.querySelector("span").textContent;
            li.remove();
            updateProgress();
            toggleEmptyState();
        });

        li.querySelector(".delete-btn").addEventListener("click", () => {
            li.remove();
            updateProgress();
            toggleEmptyState();
        });

        taskList.appendChild(li);
        taskInput.value = "";
        toggleEmptyState();
        updateProgress();
    }

    document.querySelector(".input-area").addEventListener("submit", e => {
        e.preventDefault();
        addTask(taskInput.value);
    });

    /* ---------- CONFETTI ---------- */
    function startConfetti() {
        confettiParticles = Array.from({ length: 120 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 6 + 4,
            dx: Math.random() * 4 - 2,
            dy: Math.random() * 5 + 2,
        }));

        requestAnimationFrame(drawConfetti);
        setTimeout(() => confettiParticles = [], 3000);
    }

    function drawConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        confettiParticles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 70%)`;
            ctx.fill();
            p.x += p.dx;
            p.y += p.dy;
        });

        if (confettiParticles.length > 0) {
            requestAnimationFrame(drawConfetti);
        }
    }
});
