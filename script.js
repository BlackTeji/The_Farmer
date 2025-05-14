let cropList = {};
let deliveryRates = {
    "Lagos Island": 3000,
    "Lagos Mainland": 5000,
    "Surulere": 4500,
    "Apapa": 2000,
    "Oshodi": 3000,
    "Lekki": 2500
};

document.addEventListener("DOMContentLoaded", () => {
    fetchCrops();
    populateDropdown("location", deliveryRates);
    setupFormSubmit();
});

async function fetchCrops() {
    try {
        const res = await fetch("https://script.google.com/macros/s/AKfycbwCWX2SpKPpcTCV1smERSaA8fFJ4jEBsSUkBtRwEBpvi9wRGlrIimRk7TarXMrxK4rhlw/exec");
        const crops = await res.json();
        cropList = {};
        crops.forEach(crop => {
            cropList[crop["Crop Name"]] = parseFloat(crop["Price per Kg"]);
        });
        buildCropInputs();
        updatePrice();
    } catch (err) {
        alert("Failed to load crop list.");
        console.error(err);
    }
}

function populateDropdown(id, options) {
    const select = document.getElementById(id);
    select.innerHTML = '<option value="">Select</option>';
    for (let key in options) {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = key;
        select.appendChild(opt);
    }
}

function buildCropInputs() {
    const container = document.getElementById("cropInputs");
    for (let crop in cropList) {
        const row = document.createElement("div");
        row.className = "crop-row";
        row.innerHTML = `
      <label>${crop}</label>
      <input type="number" min="0" step="1" data-crop="${crop}" value="0">
    `;
        container.appendChild(row);
    }
    container.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", updatePrice);
    });
    document.getElementById("location").addEventListener("change", updatePrice);
}

function updatePrice() {
    let total = 0;
    const inputs = document.querySelectorAll('#cropInputs input');
    inputs.forEach(input => {
        const crop = input.dataset.crop;
        const qty = parseFloat(input.value) || 0;
        const price = cropList[crop] || 0;
        total += price * qty;
    });

    const location = document.getElementById("location").value;
    const delivery = deliveryRates[location] || 0;
    const grandTotal = total + delivery;

    document.getElementById("priceDetails").textContent =
        `Crop Total: ₦${total.toLocaleString()} + Delivery: ₦${delivery.toLocaleString()} = Total: ₦${grandTotal.toLocaleString()}`;
}

function setupFormSubmit() {
    document.getElementById("orderForm").addEventListener("submit", async function (e) {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const location = document.getElementById("location").value; // Use location here

        if (!name || !phone || !location) {
            alert("Please fill in all required fields.");
            return;
        }

        const cropInputs = document.querySelectorAll('#cropInputs input');
        let crops = [];
        let cropDetails = '';
        let total = 0;

        cropInputs.forEach(input => {
            const qty = parseFloat(input.value);
            if (qty && qty > 0) {
                const crop = input.dataset.crop;
                const price = cropList[crop];
                total += qty * price;
                crops.push({ crop, quantity: qty });
                cropDetails += `- ${crop}: ${qty}kg\n`;
            }
        });

        if (crops.length === 0) {
            alert("Please select at least one crop.");
            return;
        }

        const deliveryFee = deliveryRates[location] || 0;
        const grandTotal = total + deliveryFee;

        const payload = {
            name,
            phone,
            location,
            crops,
            cropDetails,
            deliveryFee,
            grandTotal
        };

        try {
            const res = await fetch("https://script.google.com/macros/s/AKfycbwCWX2SpKPpcTCV1smERSaA8fFJ4jEBsSUkBtRwEBpvi9wRGlrIimRk7TarXMrxK4rhlw/exec", {
                method: "POST",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" }
            });

            const result = await res.text();
            if (result.includes("Success")) {
                alert("Order placed successfully!");
                this.reset();
                updatePrice();
            } else {
                alert("Failed to place order. Try again.");
            }
        } catch (err) {
            console.error(err);
            alert("Error submitting order.");
        }
    });
}
