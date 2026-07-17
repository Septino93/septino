(() => {
  "use strict";

  const WHATSAPP_NUMBER = "628116946999";

  const state = {
    activeTab: "life",
    life: null,
    critical: null,
    health: null,
    education: null,
    retirement: null,
    emergency: null
  };

  function byId(id) {
    return document.getElementById(id);
  }


  const moduleFieldRules = {
    life: [
      ["lifeInsuredName", "Nama Tertanggung"],
      ["lifeInsuredAge", "Usia"],
      ["lifeMonthlyExpense", "Pengeluaran keluarga per bulan"],
      ["lifeInstrument", "Instrumen acuan"],
      ["lifeInterestRate", "Asumsi bunga"],
      ["lifeInterestTax", "PPh bunga"],
      ["lifeExistingCoverage", "Total UP Jiwa yang sudah dimiliki", true]
    ],
    critical: [
      ["criticalInsuredName", "Nama Tertanggung"],
      ["criticalInsuredAge", "Usia"],
      ["criticalMonthlyIncome", "Penghasilan per bulan"],
      ["criticalMultiplier", "Multiplier penghasilan tahunan"],
      ["criticalExistingCoverage", "Total UP Penyakit Kritis saat ini", true]
    ],
    health: [
      ["healthInsuredName", "Nama Tertanggung"],
      ["healthInsuredAge", "Usia"],
      ["healthBpjsStatus", "Status BPJS"],
      ["healthHasPrivateInsurance", "Asuransi Kesehatan Swasta"],
      ["healthCoverageArea", "Coverage Area"],
      ["healthRoomType", "Tipe Kamar"],
      ["healthCashless", "Fasilitas Cashless"],
      ["healthDeductibleEnabled", "Deductible"],
      ["healthCopaymentEnabled", "Co-payment"],
      ["healthMedicalHistory", "Riwayat Penyakit"],
      ["healthInsuranceRejection", "Riwayat Penolakan atau Penundaan"]
    ],
    education: [
      ["educationFatherName", "Nama Ayah"],
      ["educationMotherName", "Nama Ibu"],
      ["educationFatherAge", "Usia Ayah"],
      ["educationMotherAge", "Usia Ibu"],
      ["educationRetirementAge", "Usia pensiun yang diinginkan"],
      ["educationChildName", "Nama Anak"],
      ["educationTarget", "Target Pendidikan"],
      ["educationCurrentAge", "Usia Anak"],
      ["educationEntryAge", "Usia Masuk Pendidikan"],
      ["educationCurrentCost", "Biaya pendidikan saat ini"],
      ["educationInflation", "Inflasi pendidikan"],
      ["educationExistingFund", "Dana yang sudah tersedia", true],
      ["educationPreparationYears", "Periode persiapan"],
      ["educationReturnRate", "Strategi pendanaan"]
    ],
    retirement: [
      ["retirementClientName", "Nama"],
      ["retirementMaritalStatus", "Status Pernikahan"],
      ["retirementCurrentAge", "Usia Saat Ini"],
      ["retirementTargetAge", "Usia Pensiun yang Diinginkan"],
      ["retirementCollectionYears", "Periode Pengumpulan Dana"],
      ["retirementMonthlyExpense", "Biaya Hidup Keluarga per Bulan Saat Ini"],
      ["retirementInflationRate", "Tingkat Inflasi"],
      ["retirementWithdrawalRate", "Withdrawal Rate setelah pajak"],
      ["retirementCurrentFund", "Dana Pensiun Saat Ini", true],
      ["retirementMonthlyContribution", "Setoran Bulanan Saat Ini", true]
    ],
    emergency: [
      ["emergencyClientName", "Nama"],
      ["emergencyClientAge", "Usia"],
      ["emergencyMaritalStatus", "Status Pernikahan"],
      ["emergencyMonthlyExpense", "Pengeluaran Keluarga per Bulan"],
      ["emergencyExistingFund", "Dana Darurat yang Sudah Dimiliki", true]
    ]
  };

  function fieldContainer(element) {
    return element?.closest("label") || element?.parentElement;
  }

  function clearFieldError(element) {
    const container = fieldContainer(element);
    container?.classList.remove("field-invalid");
    container?.querySelector(".field-error-message")?.remove();
  }

  function setFieldError(element, message = "Wajib diisi") {
    const container = fieldContainer(element);
    if (!container) return;
    container.classList.add("field-invalid");
    let note = container.querySelector(".field-error-message");
    if (!note) {
      note = document.createElement("small");
      note.className = "field-error-message";
      container.appendChild(note);
    }
    note.textContent = message;
  }

  function clearModuleValidation(module) {
    const panel = byId(`${module}-panel`);
    if (!panel) return;
    panel.querySelectorAll(".field-invalid").forEach(el => el.classList.remove("field-invalid"));
    panel.querySelectorAll(".field-error-message").forEach(el => el.remove());
    panel.querySelector(".validation-summary")?.remove();
  }

  function hasValue(element, allowZero = false) {
    if (!element) return false;
    const raw = String(element.value ?? "").trim();
    if (raw === "") return false;

    if (element.type === "number") {
      const n = Number(raw);
      return Number.isFinite(n) && (allowZero ? n >= 0 : n > 0);
    }

    if (element.inputMode === "numeric") {
      const n = parseCurrency(raw);
      return allowZero ? n >= 0 : n > 0;
    }

    return true;
  }

  function conditionalRules(module) {
    const rules = [];

    if (module === "health") {
      if (healthValue("healthDeductibleEnabled") === "Ya") {
        rules.push(["healthDeductibleType", "Tipe Deductible"]);
        if (healthValue("healthDeductibleType") === "Persentase") {
          rules.push(["healthDeductiblePercent", "Persentase Deductible"]);
          if (healthValue("healthDeductiblePercent") === "custom") {
            rules.push(["healthDeductibleCustomPercent", "Persentase Deductible Custom"]);
          }
        } else {
          rules.push(["healthDeductibleAmount", "Nominal Deductible"]);
          if (healthValue("healthDeductibleAmount") === "custom") {
            rules.push(["healthDeductibleCustomAmount", "Nominal Deductible Custom"]);
          }
        }
      }

      if (healthValue("healthCopaymentEnabled") === "Ya") {
        rules.push(["healthCopaymentPercent", "Persentase Co-payment"]);
        if (healthValue("healthCopaymentPercent") === "custom") {
          rules.push(["healthCopaymentCustomPercent", "Persentase Co-payment Custom"]);
        }
      }

      if (healthValue("healthMedicalHistory") === "Ada") {
        rules.push(["healthMedicalHistoryNotes", "Keterangan Riwayat Penyakit"]);
      }

      if (healthValue("healthInsuranceRejection") === "Ya") {
        rules.push(["healthInsuranceRejectionNotes", "Keterangan Penolakan atau Penundaan"]);
      }
    }

    if (module === "education" &&
        byId("educationPreparationYears")?.value === "custom") {
      rules.push(["educationCustomYears", "Periode Custom"]);
    }

    if (module === "retirement") {
      if (byId("retirementMaritalStatus")?.value === "Menikah") {
        rules.push(["retirementSpouseName", "Nama Istri"]);
        rules.push(["retirementSpouseAge", "Usia Istri"]);
      }
      if (byId("retirementCollectionYears")?.value === "custom") {
        rules.push(["retirementCustomYears", "Periode Custom"]);
      }
    }

    if (
      module === "emergency" &&
      byId("emergencyMaritalStatus")?.value === "Menikah"
    ) {
      rules.push(["emergencySpouseName", "Nama Istri"]);
      rules.push(["emergencySpouseAge", "Usia Istri"]);
      rules.push(["emergencyChildCount", "Jumlah Anak", true]);
    }

    return rules;
  }

  function validateModule(module, options = {}) {
    clearModuleValidation(module);

    const rules = [
      ...(moduleFieldRules[module] || []),
      ...conditionalRules(module)
    ];

    const errors = [];
    let firstInvalid = null;

    rules.forEach(([id, label, allowZero = false]) => {
      const element = byId(id);
      if (!element) return;
      if (!hasValue(element, allowZero)) {
        errors.push(label);
        setFieldError(element);
        firstInvalid ||= element;
      }
    });

    if (module === "education") {
      const childAge = Number(byId("educationCurrentAge")?.value) || 0;
      const entryAge = Number(byId("educationEntryAge")?.value) || 0;
      if (entryAge <= childAge) {
        errors.push("Usia masuk pendidikan harus lebih besar dari usia anak");
        setFieldError(byId("educationEntryAge"), "Harus lebih besar dari usia anak");
      }
      if (!validateEducationCustomPeriod()) {
        errors.push("Periode persiapan belum valid");
      }
    }

    if (module === "retirement") {
      const currentAge = Number(byId("retirementCurrentAge")?.value) || 0;
      const targetAge = Number(byId("retirementTargetAge")?.value) || 0;
      if (targetAge <= currentAge) {
        errors.push("Usia pensiun harus lebih besar dari usia saat ini");
        setFieldError(byId("retirementTargetAge"), "Harus lebih besar dari usia saat ini");
      }
      if (!validateRetirementCollectionPeriod()) {
        errors.push("Periode pengumpulan dana belum valid");
      }
    }

    if (errors.length) {
      if (options.showSummary !== false) {
        const panel = byId(`${module}-panel`);
        const summary = document.createElement("div");
        summary.className = "validation-summary";
        summary.innerHTML = `
          <strong>Masih ada data yang belum lengkap:</strong>
          <ul>${errors.map(item => `<li>${item}</li>`).join("")}</ul>
        `;
        panel?.insertBefore(summary, panel.firstElementChild?.nextSibling || null);
      }

      if (options.scroll !== false) {
        firstInvalid?.scrollIntoView({behavior:"smooth", block:"center"});
        firstInvalid?.focus();
      }
      return false;
    }

    return true;
  }

  function initializeValidationCleanup() {
    document.querySelectorAll(
      ".calculator-panel input, .calculator-panel select, .calculator-panel textarea"
    ).forEach(element => {
      element.addEventListener("input", () => clearFieldError(element));
      element.addEventListener("change", () => clearFieldError(element));
    });
  }

  function parseCurrency(value) {
    const raw = String(value ?? "").replace(/[^0-9]/g, "");
    return raw === "" ? 0 : Number(raw);
  }

  function formatInputCurrency(value) {
    const raw = String(value ?? "").replace(/[^0-9]/g, "");
    return raw === "" ? "" : new Intl.NumberFormat("id-ID").format(Number(raw));
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(Math.max(0, Number(value) || 0));
  }

  function setResult(resultId, value, note) {
    const box = byId(resultId);
    if (!box) return;

    const strong = box.querySelector("strong");
    const small = box.querySelector("small");

    if (strong) strong.textContent = formatCurrency(value);
    if (small) small.textContent = note;
  }

  function setStatus(id, type, message) {
    const box = byId(id);
    if (!box) return;
    box.className = `status-banner ${type}`;
    box.textContent = message;
  }

  function getActiveTab() {
    return document.querySelector(".tab-button.active")?.dataset.tab || "life";
  }

  function updateWhatsappLabel(tab) {
    const whatsappButton =
      byId("simulationWhatsappButton") ||
      document.querySelector(".simulation-whatsapp-button") ||
      document.querySelector("[onclick*='openSimulationWhatsApp']");

    if (whatsappButton) {
      whatsappButton.style.display =
        tab === "emergency" ? "none" : "";
    }

    const label = byId("simulationWhatsappLabel");
    if (!label) return;

    const labels = {
      life: "Konsultasi Premi Asuransi Jiwa",
      critical: "Konsultasi Premi Penyakit Kritis",
      education: "Konsultasi Dana Pendidikan",
      retirement: "Konsultasi Perencanaan Dana Pensiun",
      emergency: "Konsultasi Perencanaan Dana Darurat"
    };

    if (tab === "health") {
      const hasPrivateInsurance =
        healthValue("healthHasPrivateInsurance") === "Ya";

      label.textContent = hasPrivateInsurance
        ? "Review Polis Asuransi Kesehatan"
        : "Konsultasi Premi Asuransi Kesehatan";
      return;
    }

    label.textContent = labels[tab] || labels.life;
  }

  function initializeTabs() {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", () => {
        const tab = button.dataset.tab;

        document.querySelectorAll(".tab-button").forEach((item) => {
          item.classList.toggle("active", item === button);
        });

        document.querySelectorAll(".calculator-panel").forEach((panel) => {
          panel.classList.toggle("active", panel.id === `${tab}-panel`);
        });

        state.activeTab = tab;
        updateWhatsappLabel(tab);
      });
    });
  }

  function initializeCurrencyInputs() {
    document.querySelectorAll('input[inputmode="numeric"]').forEach((input) => {
      input.addEventListener("input", () => {
        input.value = formatInputCurrency(input.value);

        if (input.id === "criticalMonthlyIncome") {
          updateCriticalAnnualPreview();
        }

        if (
          input.id === "educationCurrentAge" ||
          input.id === "educationEntryAge"
        ) {
          updateEducationRemainingPreview();
        }
      });
    });
  }

  function getLifeNetRate() {
    const interest = Number(byId("lifeInterestRate")?.value) || 0;
    const tax = Number(byId("lifeInterestTax")?.value) || 0;
    return interest * (1 - tax / 100);
  }

  function calculateLifePreview() {
    const netRate = getLifeNetRate();
    const netField = byId("lifeNetInterest");
    if (netField) netField.textContent = `${Number(netRate.toFixed(2))}%`;
  }

  function syncLifeTax() {
    const instrument = byId("lifeInstrument")?.value || "Deposito";
    const taxField = byId("lifeInterestTax");

    if (taxField) {
      taxField.value = instrument === "Obligasi" ? "10" : "20";
    }

    calculateLifePreview();
  }

  function renderLifeAnalysis(data) {
    const analysis = byId("lifeAnalysisText");
    if (!analysis) return;

    const ideal = formatCurrency(data.idealCoverage);
    const existing = formatCurrency(data.existingCoverage);
    const gap = formatCurrency(data.gap);

    if (data.idealCoverage <= 0) {
      analysis.innerHTML =
        "<p>Masukkan pengeluaran keluarga dan lakukan perhitungan untuk melihat analisis kebutuhan Asuransi Jiwa.</p>";
      return;
    }

    if (data.gap <= 0) {
      analysis.innerHTML = `
        <p><strong>Berdasarkan simulasi, kebutuhan Uang Pertanggungan Jiwa Anda adalah sebesar ${ideal}, sedangkan perlindungan yang dimiliki saat ini sebesar ${existing}.</strong></p>
        <p>Perhitungan menggunakan <strong>nett bunga</strong> agar uang pertanggungan dapat dikelola dan menghasilkan dana untuk membantu kebutuhan keluarga, sehingga pokok dana tidak harus langsung habis digunakan.</p>
        <p>Perlindungan Anda saat ini sudah memenuhi kebutuhan ideal. Tetap lakukan evaluasi secara berkala karena kondisi keuangan, tanggung jawab keluarga, dan tujuan hidup dapat berubah seiring waktu. Apabila Anda ingin melakukan review lebih lanjut atau memiliki pertanyaan mengenai hasil simulasi ini, silakan hubungi saya, Septino, melalui tombol Konsultasi di bawah ini atau WhatsApp di <strong>0811-6946-999</strong>.</p>
      `;
      return;
    }

    analysis.innerHTML = `
      <p><strong>Berdasarkan simulasi, kebutuhan Uang Pertanggungan Jiwa Anda adalah sebesar ${ideal}, sedangkan perlindungan yang dimiliki saat ini sebesar ${existing}.</strong></p>
      <p>Tidak ada yang bisa menggantikan kehadiran orang yang kita sayangi. Namun ketika pencari nafkah utama sudah tidak ada, kebutuhan keluarga tetap berjalan seperti biaya makan, pendidikan anak, cicilan, dan kebutuhan sehari-hari.</p>
      <p>Karena itulah perhitungan ini menggunakan <strong>nett bunga</strong>. Tujuannya bukan agar uang pertanggungan habis dalam beberapa tahun, tetapi agar dana tersebut dapat dikelola dan menghasilkan penghasilan yang membantu keluarga tetap menjalani kehidupan sehari-hari.</p>
      <p>Saat ini masih terdapat kekurangan perlindungan sebesar <strong>${gap}</strong>. Menambah perlindungan hingga mendekati kebutuhan ideal dapat membantu menjaga kestabilan keuangan keluarga ketika mereka paling membutuhkan.</p>
      <p>Untuk membantu menutup kekurangan Uang Pertanggungan Jiwa tersebut, silakan berkonsultasi dengan <strong>Financial & Insurance Planner</strong> atau Insurance Agent Anda agar memperoleh informasi mengenai pilihan perlindungan dan estimasi premi yang sesuai dengan kebutuhan serta kemampuan keuangan Anda.</p>
      <p>Apabila Anda memerlukan diskusi atau pendampingan lebih lanjut mengenai hasil simulasi ini, saya dengan senang hati siap membantu. Silakan hubungi saya, Septino, melalui tombol Konsultasi di bawah ini atau WhatsApp di <strong>0811-6946-999</strong>.</p>
    `;
  }

  function calculateLife() {
    if (!validateModule("life")) return;
    const monthlyExpense = parseCurrency(byId("lifeMonthlyExpense")?.value);
    const existingCoverage = parseCurrency(byId("lifeExistingCoverage")?.value);
    const annualExpense = monthlyExpense * 12;
    const netRate = getLifeNetRate();
    const netDecimal = netRate / 100;
    const idealCoverage = netDecimal > 0 ? annualExpense / netDecimal : 0;
    const gap = Math.max(idealCoverage - existingCoverage, 0);
    const ratio = idealCoverage > 0
      ? Math.min(100, existingCoverage / idealCoverage * 100)
      : 0;

    state.life = {
      insuredName: byId("lifeInsuredName")?.value.trim() || "",
      insuredAge: Number(byId("lifeInsuredAge")?.value) || 0,
      monthlyExpense,
      annualExpense,
      instrument: byId("lifeInstrument")?.value || "Deposito",
      interestRate: Number(byId("lifeInterestRate")?.value) || 0,
      taxRate: Number(byId("lifeInterestTax")?.value) || 0,
      netRate,
      idealCoverage,
      existingCoverage,
      gap,
      ratio
    };

    setResult(
      "lifeResult",
      idealCoverage,
      netRate > 0
        ? `Nett bunga ${Number(netRate.toFixed(2))}% per tahun.`
        : "Pilih asumsi bunga dan PPh yang valid."
    );

    if (byId("lifeAnnualExpenseResult")) {
      byId("lifeAnnualExpenseResult").textContent = formatCurrency(annualExpense);
    }
    if (byId("lifeExistingResult")) {
      byId("lifeExistingResult").textContent = formatCurrency(existingCoverage);
    }
    if (byId("lifeGapResult")) {
      byId("lifeGapResult").textContent = formatCurrency(gap);
    }
    if (byId("lifeRatioResult")) {
      byId("lifeRatioResult").textContent = `${Math.round(ratio)}%`;
    }

    renderLifeAnalysis(state.life);

    if (idealCoverage <= 0) {
      setStatus("lifeStatusBanner", "status-gap", "Masukkan data untuk melihat hasil.");
    } else if (gap <= 0) {
      setStatus("lifeStatusBanner", "status-good", "UP Jiwa Anda sudah memenuhi kebutuhan ideal.");
    } else if (ratio >= 80) {
      setStatus(
        "lifeStatusBanner",
        "status-warning",
        `UP Jiwa Anda sudah mendekati kebutuhan ideal, tetapi masih kurang ${formatCurrency(gap)}.`
      );
    } else {
      setStatus(
        "lifeStatusBanner",
        "status-gap",
        `Masih terdapat kekurangan UP Jiwa sebesar ${formatCurrency(gap)}.`
      );
    }
  }

  function updateCriticalAnnualPreview() {
    const monthly = parseCurrency(byId("criticalMonthlyIncome")?.value);
    const preview = byId("criticalAnnualIncomePreview");
    if (preview) preview.textContent = formatCurrency(monthly * 12);
  }

  function renderCriticalAnalysis(data) {
    const analysis = byId("criticalAnalysisText");
    if (!analysis) return;

    const ideal = formatCurrency(data.idealCoverage);
    const existing = formatCurrency(data.existingCoverage);
    const gap = formatCurrency(data.gap);

    if (data.idealCoverage <= 0) {
      analysis.innerHTML =
        "<p>Masukkan penghasilan bulanan dan lakukan perhitungan untuk melihat analisis kebutuhan perlindungan Penyakit Kritis.</p>";
      return;
    }

    if (data.gap <= 0) {
      analysis.innerHTML = `
        <p><strong>Berdasarkan simulasi, kebutuhan perlindungan Penyakit Kritis Anda adalah sebesar ${ideal}, sedangkan perlindungan yang dimiliki saat ini sebesar ${existing}.</strong></p>
        <p>Perhitungan menggunakan <strong>multiplier penghasilan tahunan</strong> untuk memperkirakan berapa lama keluarga membutuhkan pengganti penghasilan apabila Anda belum dapat kembali bekerja selama masa pengobatan dan pemulihan.</p>
        <p>Perlindungan yang dimiliki saat ini sudah memenuhi kebutuhan ideal. Tetap lakukan evaluasi secara berkala karena kondisi keuangan, tanggung jawab keluarga, dan tujuan hidup dapat berubah seiring waktu. Apabila Anda ingin melakukan review lebih lanjut atau memiliki pertanyaan mengenai hasil simulasi ini, silakan hubungi saya, Septino, melalui tombol Konsultasi di bawah ini atau WhatsApp di <strong>0811-6946-999</strong>.</p>
      `;
      return;
    }

    analysis.innerHTML = `
      <p><strong>Berdasarkan simulasi, kebutuhan perlindungan Penyakit Kritis Anda adalah sebesar ${ideal}, sedangkan perlindungan yang dimiliki saat ini sebesar ${existing}.</strong></p>
      <p>Saat seseorang terkena penyakit kritis, aktivitas bekerja bisa terhenti dan penghasilan dapat berkurang bahkan hilang, sementara kebutuhan keluarga tetap berjalan.</p>
      <p>Karena itulah digunakan <strong>multiplier penghasilan tahunan</strong>. Angka tersebut menggambarkan berapa lama keluarga membutuhkan dana pengganti penghasilan selama Anda fokus menjalani pengobatan dan pemulihan.</p>
      <p>Saat ini masih terdapat kekurangan perlindungan sebesar <strong>${gap}</strong>. Tambahan perlindungan dapat membantu agar keluarga tidak harus terlalu bergantung pada tabungan, menjual aset, atau mencari utang ketika Anda sedang fokus untuk pulih.</p>
      <p>Untuk membantu menutup kekurangan perlindungan Penyakit Kritis tersebut, silakan berkonsultasi dengan <strong>Financial & Insurance Planner</strong> atau Insurance Agent Anda agar memperoleh informasi mengenai pilihan perlindungan dan estimasi premi yang sesuai dengan kebutuhan serta kemampuan keuangan Anda.</p>
      <p>Apabila Anda memerlukan diskusi atau pendampingan lebih lanjut mengenai hasil simulasi ini, saya dengan senang hati siap membantu. Silakan hubungi saya, Septino, melalui tombol Konsultasi di bawah ini atau WhatsApp di <strong>0811-6946-999</strong>.</p>
    `;
  }

  function calculateCritical() {
    if (!validateModule("critical")) return;
    const monthlyIncome = parseCurrency(byId("criticalMonthlyIncome")?.value);
    const annualIncome = monthlyIncome * 12;
    const multiplier = Number(byId("criticalMultiplier")?.value) || 5;
    const existingCoverage = parseCurrency(byId("criticalExistingCoverage")?.value);
    const idealCoverage = annualIncome * multiplier;
    const gap = Math.max(idealCoverage - existingCoverage, 0);
    const ratio = idealCoverage > 0
      ? Math.min(100, existingCoverage / idealCoverage * 100)
      : 0;

    const status = ratio >= 100 ? "Ideal" : ratio >= 80 ? "Hampir Ideal" : "Belum Ideal";

    state.critical = {
      insuredName: byId("criticalInsuredName")?.value.trim() || "",
      insuredAge: Number(byId("criticalInsuredAge")?.value) || 0,
      monthlyIncome,
      annualIncome,
      multiplier,
      existingCoverage,
      idealCoverage,
      gap,
      ratio,
      status
    };

    setResult(
      "criticalResult",
      idealCoverage,
      `Penghasilan tahunan untuk kebutuhan ${multiplier} tahun.`
    );

    if (byId("criticalAnnualIncomePreview")) {
      byId("criticalAnnualIncomePreview").textContent = formatCurrency(annualIncome);
    }
    if (byId("criticalAnnualIncomeResult")) {
      byId("criticalAnnualIncomeResult").textContent = formatCurrency(annualIncome);
    }
    if (byId("criticalExistingResult")) {
      byId("criticalExistingResult").textContent = formatCurrency(existingCoverage);
    }
    if (byId("criticalGapResult")) {
      byId("criticalGapResult").textContent = formatCurrency(gap);
    }
    if (byId("criticalRatioResult")) {
      byId("criticalRatioResult").textContent = `${Math.round(ratio)}%`;
    }

    renderCriticalAnalysis(state.critical);

    if (idealCoverage <= 0) {
      setStatus("criticalStatusBanner", "status-gap", "Masukkan data untuk melihat hasil.");
    } else if (gap <= 0) {
      setStatus(
        "criticalStatusBanner",
        "status-good",
        "UP Penyakit Kritis Anda sudah memenuhi kebutuhan ideal."
      );
    } else if (ratio >= 80) {
      setStatus(
        "criticalStatusBanner",
        "status-warning",
        `UP Penyakit Kritis sudah mendekati kebutuhan ideal, tetapi masih kurang ${formatCurrency(gap)}.`
      );
    } else {
      setStatus(
        "criticalStatusBanner",
        "status-gap",
        `Masih terdapat kekurangan UP Penyakit Kritis sebesar ${formatCurrency(gap)}.`
      );
    }
  }


  function formatYears(value) {
    const years = Math.max(0, Number(value) || 0);
    const whole = Math.floor(years);
    const months = Math.round((years - whole) * 12);

    if (whole <= 0 && months <= 0) return "0 Tahun";
    if (months > 0) return `${whole} Tahun ${months} Bulan`;
    return `${whole} Tahun`;
  }

  function syncEducationTarget() {
    const select = byId("educationTarget");
    const selected = select?.options[select.selectedIndex];
    const targetAge = selected?.dataset.age;

    if (targetAge !== undefined && targetAge !== "") {
      byId("educationEntryAge").value = targetAge;
    }

    updateEducationPeriodOptions();
  }

  function getEducationLimits() {
    const fatherAge = Number(byId("educationFatherAge")?.value) || 0;
    const motherAge = Number(byId("educationMotherAge")?.value) || 0;
    const retirementAge = Number(byId("educationRetirementAge")?.value) || 0;
    const childAge = Number(byId("educationCurrentAge")?.value) || 0;
    const entryAge = Number(byId("educationEntryAge")?.value) || 0;

    const remainingEducation = entryAge - childAge;
    const limits = [];

    if (fatherAge > 0 && retirementAge > 0) {
      limits.push(retirementAge - fatherAge);
    }

    if (motherAge > 0 && retirementAge > 0) {
      limits.push(retirementAge - motherAge);
    }

    if (remainingEducation > 0) {
      limits.push(remainingEducation);
    }

    const maxPeriod = limits.length ? Math.min(...limits) : 0;

    return {
      fatherAge,
      motherAge,
      retirementAge,
      remainingEducation,
      fatherProductiveYears:
        fatherAge > 0 && retirementAge > 0
          ? retirementAge - fatherAge
          : 0,
      motherProductiveYears:
        motherAge > 0 && retirementAge > 0
          ? retirementAge - motherAge
          : 0,
      maxPeriod
    };
  }

  function showEducationPensionWarning(message) {
    const box = byId("educationPensionWarning");
    if (!box) return;
    box.innerHTML = message;
    box.classList.remove("hidden");
  }

  function hideEducationPensionWarning() {
    const box = byId("educationPensionWarning");
    if (!box) return;
    box.innerHTML = "";
    box.classList.add("hidden");
  }

  function toggleEducationCustomPeriod() {
    const select = byId("educationPreparationYears");
    const box = byId("educationCustomPeriodBox");
    const custom = byId("educationCustomYears");
    const show = select?.value === "custom";

    if (box) box.classList.toggle("hidden", !show);

    if (show) {
      const { maxPeriod } = getEducationLimits();
      if (custom) {
        custom.max = Math.floor(maxPeriod);
        custom.placeholder = `Maksimal ${Math.floor(maxPeriod)} tahun`;
      }
    } else if (custom) {
      custom.value = "";
    }

    validateEducationCustomPeriod();
  }

  function validateEducationCustomPeriod() {
    const select = byId("educationPreparationYears");
    const custom = byId("educationCustomYears");
    const { maxPeriod } = getEducationLimits();

    if (select?.value !== "custom") {
      hideEducationPensionWarning();
      return true;
    }

    const value = Number(custom?.value) || 0;
    const maxYears = Math.floor(maxPeriod);

    if (value <= 0) {
      showEducationPensionWarning(
        `Masukkan periode custom. Maksimum yang diperbolehkan adalah <strong>${formatYears(maxPeriod)}</strong>.`
      );
      return false;
    }

    if (value > maxPeriod) {
      showEducationPensionWarning(
        `Periode custom <strong>${value} tahun</strong> melebihi batas. Maksimum periode persiapan adalah <strong>${formatYears(maxPeriod)}</strong>, berdasarkan sisa waktu menuju pendidikan dan usia pensiun orang tua. Silakan isi maksimal <strong>${maxYears} tahun</strong>.`
      );
      return false;
    }

    hideEducationPensionWarning();
    return true;
  }

  function updateEducationPeriodOptions() {
    const select = byId("educationPreparationYears");
    const info = byId("educationPeriodInfo");
    const custom = byId("educationCustomYears");
    const previous = select?.value || "";
    const limits = getEducationLimits();
    const maxPeriod = limits.maxPeriod;
    const remainingEducation = limits.remainingEducation;

    if (!select) return;

    select.innerHTML = "";
    hideEducationPensionWarning();

    if (!Number.isFinite(maxPeriod) || maxPeriod <= 0) {
      select.innerHTML =
        '<option value="">Lengkapi data dahulu</option>';
      if (info) {
        info.textContent =
          "Isi usia ayah, usia ibu, usia pensiun, usia anak, dan usia masuk pendidikan.";
      }
      byId("educationCustomPeriodBox")?.classList.add("hidden");
      updateEducationRemainingPreview();
      return;
    }

    [3, 5, 8, 10].forEach((years) => {
      if (years <= maxPeriod) {
        const option = document.createElement("option");
        option.value = String(years);
        option.textContent = `${years} Tahun`;
        select.appendChild(option);
      }
    });

    if (
      remainingEducation > 0 &&
      remainingEducation <= maxPeriod
    ) {
      const option = document.createElement("option");
      option.value = "target";
      option.textContent =
        `Sampai Anak Masuk Pendidikan (${formatYears(remainingEducation)})`;
      select.appendChild(option);
    }

    if (maxPeriod >= 10) {
      const option = document.createElement("option");
      option.value = "custom";
      option.textContent = "Custom / Tentukan Sendiri";
      select.appendChild(option);
    }

    if (!select.options.length) {
      const safeYears = Math.max(1, Math.floor(maxPeriod));
      const option = document.createElement("option");
      option.value = String(safeYears);
      option.textContent = `${safeYears} Tahun`;
      select.appendChild(option);
    }

    if ([...select.options].some((option) => option.value === previous)) {
      select.value = previous;
    }

    if (custom) {
      custom.max = Math.floor(maxPeriod);
    }

    if (info) {
      info.textContent =
        `Periode maksimum yang diperbolehkan: ${formatYears(maxPeriod)}, berdasarkan sisa waktu pendidikan dan usia pensiun orang tua.`;
    }

    toggleEducationCustomPeriod();
    updateEducationRemainingPreview();
  }

  function getEducationPreparationYears() {
    const select = byId("educationPreparationYears");
    const limits = getEducationLimits();
    const value = select?.value || "";

    if (value === "target") {
      return Math.min(
        limits.remainingEducation,
        limits.maxPeriod
      );
    }

    if (value === "custom") {
      return Number(byId("educationCustomYears")?.value) || 0;
    }

    return Math.min(
      Number(value) || 0,
      limits.maxPeriod
    );
  }

  function updateEducationRemainingPreview() {
    const limits = getEducationLimits();
    const preview = byId("educationRemainingPreview");

    if (preview) {
      preview.textContent = formatYears(
        limits.remainingEducation
      );
    }
  }

  function calculateEducationMonthlyContribution(gap, years, annualRate) {
    if (gap <= 0 || years <= 0) return 0;

    const months = Math.round(years * 12);
    const monthlyRate = annualRate / 12;

    if (monthlyRate <= 0) {
      return gap / months;
    }

    return gap * monthlyRate /
      (Math.pow(1 + monthlyRate, months) - 1);
  }

  function renderEducationAnalysis(data) {
    const analysis = byId("educationAnalysisText");
    if (!analysis) return;

    if (data.targetFund <= 0) {
      analysis.innerHTML =
        "<p>Masukkan biaya pendidikan dan data usia anak untuk melihat analisis kebutuhan Dana Pendidikan.</p>";
      return;
    }

    const childName = data.childName || "anak Anda";
    const targetFund = formatCurrency(data.targetFund);
    const existing = formatCurrency(data.existingFund);
    const gap = formatCurrency(data.gap);
    const monthly = formatCurrency(data.monthlyContribution);

    if (data.gap <= 0) {
      analysis.innerHTML = `
        <p><strong>Berdasarkan simulasi, kebutuhan dana pendidikan ${childName} diperkirakan sebesar ${targetFund}, sementara dana yang tersedia saat ini sebesar ${existing}.</strong></p>
        <p>Biaya pendidikan cenderung meningkat dari tahun ke tahun. Karena itu, nilai kebutuhan dihitung menggunakan inflasi agar target yang disiapkan tidak hanya berdasarkan biaya hari ini.</p>
        <p>Dana yang tersedia sudah memenuhi estimasi kebutuhan. Tetap lakukan evaluasi secara berkala karena kondisi keuangan, tanggung jawab keluarga, dan tujuan hidup dapat berubah seiring waktu. Apabila Anda ingin melakukan review lebih lanjut atau memiliki pertanyaan mengenai hasil simulasi ini, silakan hubungi saya, Septino, melalui tombol Konsultasi di bawah ini atau WhatsApp di <strong>0811-6946-999</strong>.</p>
      `;
      return;
    }

    analysis.innerHTML = `
      <p><strong>Berdasarkan simulasi, kebutuhan dana pendidikan ${childName} diperkirakan sebesar ${targetFund}, sedangkan dana yang tersedia saat ini sebesar ${existing}.</strong></p>
      <p>Biaya pendidikan cenderung meningkat setiap tahun. Karena itulah perhitungan menggunakan inflasi pendidikan, agar dana yang dipersiapkan lebih mendekati biaya saat ${childName} mulai menempuh pendidikan.</p>
      <p>Saat ini masih terdapat kekurangan dana sebesar <strong>${gap}</strong>. Periode persiapan dibatasi maksimal <strong>${formatYears(data.maxPeriod)}</strong>, yaitu batas paling pendek antara waktu menuju pendidikan dan sisa masa produktif orang tua sebelum pensiun.</p>
      <p>Dengan periode persiapan ${formatYears(data.preparationYears)} dan strategi ${data.strategyLabel}, estimasi setoran yang perlu dipersiapkan sekitar <strong>${monthly} per bulan</strong>. Memulai lebih awal memberi waktu lebih panjang bagi dana untuk berkembang dan membantu meringankan beban bulanan keluarga.</p>
      <p>Untuk membantu menutup kekurangan Dana Pendidikan tersebut, silakan berkonsultasi dengan <strong>Financial Planner</strong> Anda agar memperoleh strategi persiapan dana yang sesuai dengan target pendidikan, jangka waktu, dan kemampuan keuangan keluarga.</p>
      <p>Apabila Anda memerlukan diskusi atau pendampingan lebih lanjut mengenai hasil simulasi ini, saya dengan senang hati siap membantu. Silakan hubungi saya, Septino, melalui tombol Konsultasi di bawah ini atau WhatsApp di <strong>0811-6946-999</strong>.</p>
    `;
  }

  function calculateEducation() {
    if (!validateModule("education")) return;
    const fatherName = byId("educationFatherName")?.value.trim() || "";
    const motherName = byId("educationMotherName")?.value.trim() || "";
    const childName = byId("educationChildName")?.value.trim() || "";
    const targetSelect = byId("educationTarget");
    const targetLabel =
      targetSelect?.options[targetSelect.selectedIndex]?.text || "Pendidikan";
    const currentAge = Number(byId("educationCurrentAge")?.value) || 0;
    const entryAge = Number(byId("educationEntryAge")?.value) || 0;
    const currentCost = parseCurrency(byId("educationCurrentCost")?.value);
    const inflation = (Number(byId("educationInflation")?.value) || 0) / 100;
    const existingFund = parseCurrency(byId("educationExistingFund")?.value);
    const annualReturn = Number(byId("educationReturnRate")?.value) || 0;
    const limits = getEducationLimits();
    const remainingYears = limits.remainingEducation;
    const preparationYears = getEducationPreparationYears();

    if (
      limits.fatherAge <= 0 ||
      limits.motherAge <= 0 ||
      limits.retirementAge <= 0
    ) {
      alert("Lengkapi usia ayah, usia ibu, dan usia pensiun.");
      return;
    }

    if (limits.maxPeriod <= 0) {
      alert("Tidak tersedia masa persiapan sebelum usia pensiun. Periksa kembali usia orang tua dan usia pensiun.");
      return;
    }

    if (!validateEducationCustomPeriod()) {
      return;
    }

    if (remainingYears <= 0 || currentCost <= 0 || preparationYears <= 0) {
      alert("Lengkapi usia anak, usia masuk, biaya pendidikan, dan periode persiapan dengan benar.");
      return;
    }

    const targetFund =
      currentCost * Math.pow(1 + inflation, remainingYears);
    const gap = Math.max(targetFund - existingFund, 0);
    const monthlyContribution =
      calculateEducationMonthlyContribution(
        gap,
        preparationYears,
        annualReturn
      );

    const strategyLabel =
      annualReturn <= 0.02
        ? "Konservatif"
        : annualReturn >= 0.06
          ? "Agresif"
          : "Moderat";

    state.education = {
      fatherName,
      motherName,
      childName,
      targetLabel,
      fatherAge: limits.fatherAge,
      motherAge: limits.motherAge,
      retirementAge: limits.retirementAge,
      fatherProductiveYears: limits.fatherProductiveYears,
      motherProductiveYears: limits.motherProductiveYears,
      maxPeriod: limits.maxPeriod,
      currentAge,
      entryAge,
      currentCost,
      inflation,
      existingFund,
      annualReturn,
      remainingYears,
      preparationYears,
      targetFund,
      gap,
      monthlyContribution,
      strategyLabel
    };

    setResult(
      "educationResult",
      targetFund,
      `Estimasi biaya dalam ${formatYears(remainingYears)} dengan inflasi ${Number((inflation * 100).toFixed(1))}% per tahun.`
    );

    if (byId("educationRemainingResult")) {
      byId("educationRemainingResult").textContent =
        formatYears(remainingYears);
    }
    if (byId("educationMaxPeriodResult")) {
      byId("educationMaxPeriodResult").textContent =
        formatYears(limits.maxPeriod);
    }
    if (byId("educationExistingResult")) {
      byId("educationExistingResult").textContent =
        formatCurrency(existingFund);
    }
    if (byId("educationGapResult")) {
      byId("educationGapResult").textContent =
        formatCurrency(gap);
    }
    if (byId("educationMonthlyResult")) {
      byId("educationMonthlyResult").textContent =
        `${formatCurrency(monthlyContribution)} / bulan`;
    }

    renderEducationAnalysis(state.education);

    if (gap <= 0) {
      setStatus(
        "educationStatusBanner",
        "status-good",
        "Dana pendidikan yang tersedia sudah memenuhi estimasi kebutuhan."
      );
    } else {
      setStatus(
        "educationStatusBanner",
        "status-gap",
        `Masih terdapat kekurangan Dana Pendidikan sebesar ${formatCurrency(gap)}.`
      );
    }
  }

  function healthValue(id) {
    return byId(id)?.value || "";
  }

  function healthNumber(id) {
    return Number(byId(id)?.value || 0);
  }

  function toggleHealthElement(id, show) {
    const element = byId(id);
    if (element) element.classList.toggle("hidden", !show);
  }

  function getHealthDeductible() {
    const enabled = healthValue("healthDeductibleEnabled") === "Ya";

    if (!enabled) {
      return {
        enabled: false,
        type: "Tidak Ada",
        percent: 0,
        amount: 0
      };
    }

    const type = healthValue("healthDeductibleType");

    if (type === "Persentase") {
      const selected = healthValue("healthDeductiblePercent");
      const percent = selected === "custom"
        ? healthNumber("healthDeductibleCustomPercent")
        : Number(selected || 0);

      return {
        enabled: true,
        type,
        percent,
        amount: 0
      };
    }

    const selected = healthValue("healthDeductibleAmount");
    const amount = selected === "custom"
      ? parseCurrency(healthValue("healthDeductibleCustomAmount"))
      : Number(selected || 0);

    return {
      enabled: true,
      type,
      percent: 0,
      amount
    };
  }

  function getHealthCopayment() {
    const enabled = healthValue("healthCopaymentEnabled") === "Ya";

    if (!enabled) {
      return {
        enabled: false,
        percent: 0
      };
    }

    const selected = healthValue("healthCopaymentPercent");
    const percent = selected === "custom"
      ? healthNumber("healthCopaymentCustomPercent")
      : Number(selected || 0);

    return {
      enabled: true,
      percent
    };
  }

  function formatHealthPercent(value) {
    const number = Number(value || 0);
    return `${Number.isInteger(number) ? number.toFixed(0) : number.toFixed(1)}%`;
  }

  function formatHealthDeductible(data) {
    if (!data.enabled) return "Tidak Ada";
    if (data.type === "Persentase") return formatHealthPercent(data.percent);
    return formatCurrency(data.amount);
  }

  function formatHealthCopayment(data) {
    if (!data.enabled) return "Tidak Ada";
    return formatHealthPercent(data.percent);
  }

  function buildHealthAnalysis(data) {
    const hasBpjs = data.bpjsStatus !== "Tidak Ada";
    const hasPrivateInsurance = data.hasPrivateInsurance === "Ya";

    if (!hasBpjs && !hasPrivateInsurance) {
      return {
        status: "Prioritas Tinggi",
        description:
          "Belum memiliki BPJS maupun Asuransi Kesehatan Swasta. Disarankan segera memiliki perlindungan kesehatan sesuai kebutuhan.",
        statusClass: "status-danger"
      };
    }

    if (hasBpjs && hasPrivateInsurance) {
      return {
        status: "Proteksi Lengkap",
        description:
          "Sudah memiliki BPJS dan Asuransi Kesehatan Swasta sehingga perlindungan kesehatan lebih komprehensif.",
        statusClass: "status-good"
      };
    }

    if (hasBpjs) {
      return {
        status: "Sesuai Kebutuhan",
        description:
          "Sudah memiliki BPJS. Penambahan Asuransi Kesehatan Swasta bersifat opsional dan dapat dipertimbangkan sesuai kebutuhan serta kemampuan finansial.",
        statusClass: "status-warning"
      };
    }

    return {
      status: "Sesuai Kebutuhan",
      description:
        "Sudah memiliki Asuransi Kesehatan Swasta. Penambahan BPJS bersifat opsional dan dapat dipertimbangkan sesuai kebutuhan serta kemampuan finansial.",
      statusClass: "status-warning"
    };
  }

  function renderHealthAnalysis(data, analysis) {
    const box = byId("healthAnalysisText");
    if (!box) return;

    const historyNote =
      data.medicalHistory === "Ada"
        ? " Anda juga mencatat adanya riwayat penyakit, sehingga proses pengajuan dapat memerlukan pemeriksaan dan evaluasi tambahan."
        : "";

    const rejectionNote =
      data.insuranceRejection === "Ya"
        ? " Riwayat penolakan atau penundaan asuransi sebelumnya juga perlu dijelaskan secara lengkap saat konsultasi."
        : "";

    if (analysis.status === "Prioritas Tinggi") {
      box.innerHTML = `
        <p><strong>Berdasarkan jawaban yang diberikan, perlindungan kesehatan Anda saat ini masih menjadi prioritas tinggi.</strong></p>
        <p>Anda belum memiliki BPJS maupun Asuransi Kesehatan Swasta. Apabila terjadi rawat inap atau tindakan medis, biaya perawatan berpotensi harus ditanggung langsung menggunakan tabungan atau aset keluarga.</p>
        <p>Disarankan mulai memiliki perlindungan dasar terlebih dahulu, kemudian menyesuaikan coverage area, tipe kamar, cashless, deductible, dan co-payment dengan kebutuhan serta kemampuan finansial.${historyNote}${rejectionNote}</p>
        <p>Silakan berkonsultasi dengan <strong>Financial & Insurance Planner</strong> atau Insurance Agent Anda untuk memperoleh informasi mengenai manfaat, area pertanggungan, tipe kamar, dan estimasi premi Asuransi Kesehatan yang sesuai dengan kebutuhan Anda.</p>
        <p>Apabila Anda memerlukan diskusi atau pendampingan lebih lanjut mengenai hasil simulasi ini, saya dengan senang hati siap membantu. Silakan hubungi saya, Septino, melalui tombol Konsultasi di bawah ini atau WhatsApp di <strong>0811-6946-999</strong>.</p>
      `;
      return;
    }

    if (analysis.status === "Proteksi Lengkap") {
      box.innerHTML = `
        <p><strong>Berdasarkan jawaban yang diberikan, perlindungan kesehatan Anda sudah tergolong lengkap.</strong></p>
        <p>Kombinasi BPJS dan Asuransi Kesehatan Swasta dapat memberikan pilihan perlindungan yang lebih luas. Namun, manfaat yang dimiliki tetap perlu diperiksa agar area pertanggungan, tipe kamar, fasilitas cashless, deductible, dan co-payment sesuai dengan kebutuhan.</p>
        <p>Evaluasi berkala penting dilakukan karena biaya kesehatan dan kebutuhan keluarga dapat berubah.${historyNote}${rejectionNote}</p>
        <p>Tetap lakukan evaluasi secara berkala karena kondisi keuangan, tanggung jawab keluarga, dan tujuan hidup dapat berubah seiring waktu. Apabila Anda ingin melakukan review lebih lanjut atau memiliki pertanyaan mengenai hasil simulasi ini, silakan hubungi saya, Septino, melalui tombol Konsultasi di bawah ini atau WhatsApp di <strong>0811-6946-999</strong>.</p>
      `;
      return;
    }

    box.innerHTML = `
      <p><strong>Berdasarkan jawaban yang diberikan, Anda sudah memiliki salah satu bentuk perlindungan kesehatan.</strong></p>
      <p>Perlindungan tersebut dapat menjadi dasar yang baik. Tambahan perlindungan dapat dipertimbangkan apabila Anda membutuhkan akses rumah sakit yang lebih luas, tipe kamar tertentu, fasilitas cashless, atau ingin mengurangi potensi biaya yang dibayar sendiri.</p>
      <p>Keputusan penambahan perlindungan tetap perlu disesuaikan dengan kebutuhan dan kemampuan finansial.${historyNote}${rejectionNote}</p>
      <p>Silakan berkonsultasi dengan <strong>Financial & Insurance Planner</strong> atau Insurance Agent Anda untuk menilai apakah perlindungan yang dimiliki masih perlu dilengkapi atau direview sesuai kebutuhan Anda saat ini.</p>
      <p>Apabila Anda memerlukan diskusi atau pendampingan lebih lanjut mengenai hasil simulasi ini, saya dengan senang hati siap membantu. Silakan hubungi saya, Septino, melalui tombol Konsultasi di bawah ini atau WhatsApp di <strong>0811-6946-999</strong>.</p>
    `;
  }

  function updateHealthConditionalFields() {
    const deductibleEnabled =
      healthValue("healthDeductibleEnabled") === "Ya";
    const deductibleType =
      healthValue("healthDeductibleType");
    const deductiblePercent =
      healthValue("healthDeductiblePercent");
    const deductibleAmount =
      healthValue("healthDeductibleAmount");

    toggleHealthElement(
      "healthDeductibleDetail",
      deductibleEnabled
    );
    toggleHealthElement(
      "healthDeductiblePercentBox",
      deductibleEnabled && deductibleType === "Persentase"
    );
    toggleHealthElement(
      "healthDeductibleAmountBox",
      deductibleEnabled && deductibleType === "Nominal"
    );
    toggleHealthElement(
      "healthDeductibleCustomPercentBox",
      deductibleEnabled &&
      deductibleType === "Persentase" &&
      deductiblePercent === "custom"
    );
    toggleHealthElement(
      "healthDeductibleCustomAmountBox",
      deductibleEnabled &&
      deductibleType === "Nominal" &&
      deductibleAmount === "custom"
    );

    const copaymentEnabled =
      healthValue("healthCopaymentEnabled") === "Ya";
    const copaymentPercent =
      healthValue("healthCopaymentPercent");

    toggleHealthElement(
      "healthCopaymentDetail",
      copaymentEnabled
    );
    toggleHealthElement(
      "healthCopaymentCustomBox",
      copaymentEnabled && copaymentPercent === "custom"
    );

    toggleHealthElement(
      "healthMedicalHistoryNotesBox",
      healthValue("healthMedicalHistory") === "Ada"
    );
    toggleHealthElement(
      "healthInsuranceRejectionNotesBox",
      healthValue("healthInsuranceRejection") === "Ya"
    );

    calculateHealthQuestionnaire();
  }

  function calculateHealthQuestionnaire() {
    const deductible = getHealthDeductible();
    const copayment = getHealthCopayment();

    const data = {
      method: "Asuransi Kesehatan",
      insuredName: healthValue("healthInsuredName"),
      insuredAge: healthNumber("healthInsuredAge"),
      bpjsStatus: healthValue("healthBpjsStatus"),
      hasPrivateInsurance:
        healthValue("healthHasPrivateInsurance"),
      coverageArea: healthValue("healthCoverageArea"),
      roomType: healthValue("healthRoomType"),
      cashless: healthValue("healthCashless"),
      deductible,
      copayment,
      medicalHistory: healthValue("healthMedicalHistory"),
      medicalHistoryNotes:
        healthValue("healthMedicalHistoryNotes"),
      insuranceRejection:
        healthValue("healthInsuranceRejection"),
      insuranceRejectionNotes:
        healthValue("healthInsuranceRejectionNotes")
    };

    const analysis = buildHealthAnalysis(data);

    state.health = {
      ...data,
      status: analysis.status,
      statusDescription: analysis.description
    };

    if (byId("healthStatusTitle")) {
      byId("healthStatusTitle").textContent = analysis.status;
    }
    if (byId("healthStatusDescription")) {
      byId("healthStatusDescription").textContent = analysis.description;
    }

    const statusCard = byId("healthStatusCard");
    if (statusCard) {
      statusCard.className =
        `health-status-card ${analysis.statusClass}`;
    }

    const summaries = {
      healthSummaryBpjs: data.bpjsStatus || "-",
      healthSummaryPrivateInsurance:
        data.hasPrivateInsurance || "-",
      healthSummaryCoverageArea:
        data.coverageArea || "-",
      healthSummaryRoomType:
        data.roomType || "-",
      healthSummaryCashless:
        data.cashless || "-",
      healthSummaryDeductible:
        formatHealthDeductible(deductible),
      healthSummaryCopayment:
        formatHealthCopayment(copayment)
    };

    Object.entries(summaries).forEach(([id, value]) => {
      if (byId(id)) byId(id).textContent = value;
    });

    renderHealthAnalysis(data, analysis);
    updateWhatsappLabel("health");
    return state.health;
  }


  function updateRetirementSpouseFields() {
    const married =
      byId("retirementMaritalStatus")?.value === "Menikah";
    const box = byId("retirementSpouseFields");

    if (box) box.classList.toggle("hidden", !married);

    if (!married) {
      if (byId("retirementSpouseName")) {
        byId("retirementSpouseName").value = "";
      }
      if (byId("retirementSpouseAge")) {
        byId("retirementSpouseAge").value = "";
      }
    }
  }


  function getEmergencyMultiplier() {
    const married =
      byId("emergencyMaritalStatus")?.value === "Menikah";
    const childCount =
      Number(byId("emergencyChildCount")?.value) || 0;
    const selected =
      Number(byId("emergencyMultiplierSelect")?.value) || 9;

    if (!married) return 3;
    if (childCount === 0) return 6;
    return selected === 12 ? 12 : 9;
  }

  function updateEmergencySpouseFields() {
    const married =
      byId("emergencyMaritalStatus")?.value === "Menikah";
    const box = byId("emergencySpouseFields");

    if (box) box.classList.toggle("hidden", !married);

    if (!married) {
      if (byId("emergencySpouseName")) {
        byId("emergencySpouseName").value = "";
      }
      if (byId("emergencySpouseAge")) {
        byId("emergencySpouseAge").value = "";
      }
      if (byId("emergencyChildCount")) {
        byId("emergencyChildCount").value = "0";
      }
    }

    updateEmergencyMultiplierOptions();
  }

  function updateEmergencyMultiplierOptions() {
    const married =
      byId("emergencyMaritalStatus")?.value === "Menikah";
    const childCount =
      Number(byId("emergencyChildCount")?.value) || 0;
    const preview = byId("emergencyMultiplierPreview");
    const select = byId("emergencyMultiplierSelect");

    if (!married) {
      if (select) {
        select.innerHTML = '<option value="3">3 Bulan</option>';
        select.value = "3";
        select.disabled = true;
      }
      if (preview) preview.textContent = "3 Bulan";
      return;
    }

    if (childCount === 0) {
      if (select) {
        select.innerHTML = '<option value="6">6 Bulan</option>';
        select.value = "6";
        select.disabled = true;
      }
      if (preview) preview.textContent = "6 Bulan";
      return;
    }

    if (select) {
      const previous = select.value;
      select.innerHTML =
        '<option value="9">9 Bulan</option><option value="12">12 Bulan</option>';
      select.disabled = false;
      select.value = previous === "12" ? "12" : "9";
    }

    if (preview) {
      preview.textContent =
        `${Number(select?.value || 9)} Bulan`;
    }
  }

  function renderEmergencyAnalysis(data) {
    const box = byId("emergencyAnalysisText");
    if (!box) return;

    const ideal = formatCurrency(data.idealFund);
    const existing = formatCurrency(data.existingFund);
    const gap = formatCurrency(data.gap);

    if (data.idealFund <= 0) {
      box.innerHTML =
        "<p>Masukkan data dan lakukan perhitungan untuk melihat analisis kebutuhan Dana Darurat.</p>";
      return;
    }

    if (data.gap <= 0) {
      box.innerHTML = `
        <p><strong>Berdasarkan hasil simulasi, kebutuhan Dana Darurat Anda diperkirakan sebesar ${ideal}, sedangkan dana yang tersedia saat ini sebesar ${existing}.</strong></p>
        <p>Dana Darurat yang dimiliki saat ini sudah memenuhi kebutuhan ideal. Kondisi ini memberikan perlindungan finansial yang lebih baik ketika menghadapi kebutuhan mendesak atau gangguan penghasilan.</p>
        <p>Tetap lakukan evaluasi secara berkala karena pengeluaran keluarga dan kondisi kehidupan dapat berubah. Apabila Anda ingin melakukan review lebih lanjut atau memiliki pertanyaan mengenai hasil simulasi ini, silakan hubungi saya, Septino, melalui tombol Konsultasi di bawah ini atau WhatsApp di <strong>0811-6946-999</strong>.</p>
      `;
      return;
    }

    box.innerHTML = `
      <p><strong>Berdasarkan simulasi, kebutuhan Dana Darurat Anda diperkirakan sebesar ${ideal}, sedangkan dana yang tersedia saat ini sebesar ${existing}.</strong></p>
      <p>Dana Darurat berfungsi sebagai perlindungan pertama ketika terjadi kondisi yang tidak direncanakan, seperti kehilangan penghasilan, kebutuhan medis mendesak, atau pengeluaran penting lainnya.</p>
      <p>Saat ini masih terdapat kekurangan Dana Darurat sebesar <strong>${gap}</strong>. Melengkapi dana tersebut secara bertahap dapat membantu menjaga kebutuhan hidup tetap berjalan tanpa harus menjual aset atau menambah utang.</p>
      <p>Dana Darurat merupakan fondasi utama dalam perencanaan keuangan. Sebaiknya pembentukan Dana Darurat menjadi salah satu prioritas sebelum mengejar tujuan keuangan jangka panjang lainnya, sehingga kondisi keuangan keluarga tetap lebih aman dan terjaga.</p>
    `;
  }

  function calculateEmergency() {
    if (!validateModule("emergency")) return;

    const clientName =
      byId("emergencyClientName")?.value.trim() || "";
    const clientAge =
      Number(byId("emergencyClientAge")?.value) || 0;
    const maritalStatus =
      byId("emergencyMaritalStatus")?.value || "Belum Menikah";
    const spouseName =
      maritalStatus === "Menikah"
        ? byId("emergencySpouseName")?.value.trim() || ""
        : "";
    const spouseAge =
      maritalStatus === "Menikah"
        ? Number(byId("emergencySpouseAge")?.value) || 0
        : 0;
    const childCount =
      maritalStatus === "Menikah"
        ? Number(byId("emergencyChildCount")?.value) || 0
        : 0;
    const monthlyExpense =
      parseCurrency(byId("emergencyMonthlyExpense")?.value);
    const existingFund =
      parseCurrency(byId("emergencyExistingFund")?.value);
    const multiplier = getEmergencyMultiplier();

    const idealFund = monthlyExpense * multiplier;
    const gap = Math.max(idealFund - existingFund, 0);
    const ratio =
      idealFund > 0
        ? Math.min(100, existingFund / idealFund * 100)
        : 0;

    state.emergency = {
      clientName,
      clientAge,
      maritalStatus,
      spouseName,
      spouseAge,
      childCount,
      monthlyExpense,
      existingFund,
      multiplier,
      idealFund,
      gap,
      ratio
    };

    setResult(
      "emergencyResult",
      idealFund,
      `${multiplier} bulan pengeluaran keluarga.`
    );

    if (byId("emergencyMultiplierResult")) {
      byId("emergencyMultiplierResult").textContent =
        `${multiplier} Bulan`;
    }
    if (byId("emergencyExistingResult")) {
      byId("emergencyExistingResult").textContent =
        formatCurrency(existingFund);
    }
    if (byId("emergencyGapResult")) {
      byId("emergencyGapResult").textContent =
        formatCurrency(gap);
    }
    if (byId("emergencyRatioResult")) {
      byId("emergencyRatioResult").textContent =
        `${Math.round(ratio)}%`;
    }

    renderEmergencyAnalysis(state.emergency);

    if (gap <= 0) {
      setStatus(
        "emergencyStatusBanner",
        "status-good",
        "Dana Darurat yang tersedia sudah memenuhi kebutuhan ideal."
      );
    } else if (ratio >= 80) {
      setStatus(
        "emergencyStatusBanner",
        "status-warning",
        `Dana Darurat sudah mendekati kebutuhan ideal, tetapi masih kurang ${formatCurrency(gap)}.`
      );
    } else {
      setStatus(
        "emergencyStatusBanner",
        "status-gap",
        `Masih terdapat kekurangan Dana Darurat sebesar ${formatCurrency(gap)}.`
      );
    }
  }

  function getRetirementYearsToTarget() {
    const currentAge = Number(byId("retirementCurrentAge")?.value) || 0;
    const targetAge = Number(byId("retirementTargetAge")?.value) || 0;
    return Math.max(targetAge - currentAge, 0);
  }

  function updateRetirementYearsPreview() {
    const years = getRetirementYearsToTarget();
    const preview = byId("retirementYearsPreview");
    if (preview) preview.textContent = formatYears(years);
    updateRetirementCollectionOptions();
  }

  function updateRetirementCollectionOptions() {
    const select = byId("retirementCollectionYears");
    const info = byId("retirementCollectionInfo");
    const custom = byId("retirementCustomYears");
    const previous = select?.value || "";
    const maxYears = getRetirementYearsToTarget();

    if (!select) return;

    select.innerHTML = "";

    if (maxYears <= 0) {
      select.innerHTML =
        '<option value="">Lengkapi usia dahulu</option>';
      if (info) {
        info.textContent =
          "Periode maksimal mengikuti sisa waktu menuju usia pensiun.";
      }
      byId("retirementCustomPeriodBox")?.classList.add("hidden");
      return;
    }

    [3, 5, 8, 10].forEach((years) => {
      if (years <= maxYears) {
        const option = document.createElement("option");
        option.value = String(years);
        option.textContent = `${years} Tahun`;
        select.appendChild(option);
      }
    });

    const customOption = document.createElement("option");
    customOption.value = "custom";
    customOption.textContent = "Custom / Tentukan Sendiri";
    select.appendChild(customOption);

    const untilRetirementOption = document.createElement("option");
    untilRetirementOption.value = "retirement";
    untilRetirementOption.textContent =
      `Sampai Usia Pensiun (${formatYears(maxYears)})`;
    select.appendChild(untilRetirementOption);

    if ([...select.options].some((option) => option.value === previous)) {
      select.value = previous;
    }

    if (custom) {
      custom.max = Math.floor(maxYears);
      custom.placeholder = `Maksimal ${Math.floor(maxYears)} tahun`;
    }

    if (info) {
      info.textContent =
        `Maksimal periode pengumpulan dana: ${formatYears(maxYears)}.`;
    }

    toggleRetirementCustomPeriod();
  }

  function toggleRetirementCustomPeriod() {
    const select = byId("retirementCollectionYears");
    const box = byId("retirementCustomPeriodBox");
    const show = select?.value === "custom";

    if (box) box.classList.toggle("hidden", !show);

    if (!show && byId("retirementCustomYears")) {
      byId("retirementCustomYears").value = "";
    }

    validateRetirementCollectionPeriod();
  }

  function validateRetirementCollectionPeriod() {
    const select = byId("retirementCollectionYears");
    const custom = byId("retirementCustomYears");
    const warning = byId("retirementPeriodWarning");
    const maxYears = getRetirementYearsToTarget();

    if (!warning) return true;

    warning.classList.add("hidden");
    warning.innerHTML = "";

    if (!select?.value) return false;

    if (select.value !== "custom") return true;

    const value = Number(custom?.value) || 0;

    if (value <= 0) {
      warning.innerHTML =
        `Masukkan periode custom. Maksimal sampai usia pensiun adalah <strong>${formatYears(maxYears)}</strong>.`;
      warning.classList.remove("hidden");
      return false;
    }

    if (value > maxYears) {
      warning.innerHTML =
        `Periode custom <strong>${value} tahun</strong> melebihi sisa waktu menuju pensiun. Maksimal yang diperbolehkan adalah <strong>${formatYears(maxYears)}</strong>.`;
      warning.classList.remove("hidden");
      return false;
    }

    return true;
  }

  function getRetirementCollectionYears() {
    const select = byId("retirementCollectionYears");
    const maxYears = getRetirementYearsToTarget();
    const value = select?.value || "";

    if (value === "retirement") return maxYears;
    if (value === "custom") {
      return Number(byId("retirementCustomYears")?.value) || 0;
    }

    return Math.min(Number(value) || 0, maxYears);
  }

  function renderRetirementAnalysis(data) {
    const box = byId("retirementAnalysisText");
    if (!box) return;

    const required = formatCurrency(data.requiredFund);
    const projected = formatCurrency(data.projectedFund);
    const gap = formatCurrency(data.fundingGap);
    const monthly = formatCurrency(data.requiredMonthlyContribution);

    if (data.requiredFund <= 0) {
      box.innerHTML =
        "<p>Masukkan data biaya hidup dan usia pensiun untuk melihat analisis kesiapan Dana Pensiun.</p>";
      return;
    }

    if (data.fundingGap <= 0) {
      box.innerHTML = `
        <p><strong>Berdasarkan simulasi, kebutuhan Dana Pensiun Anda diperkirakan sebesar ${required}, sedangkan dana terproyeksi saat pensiun sebesar ${projected}.</strong></p>
        <p>Biaya hidup saat pensiun sudah memperhitungkan inflasi, sehingga angka yang dibutuhkan tidak hanya berdasarkan biaya hidup hari ini. Kebutuhan dana menggunakan withdrawal rate <strong>${Number(data.withdrawalRatePercent.toFixed(1))}% setelah pajak</strong> agar pengeluaran tahunan dapat dibiayai dari dana pensiun yang tersedia.</p>
        <p>Dana terproyeksi saat ini sudah memenuhi kebutuhan ideal. Tetap lakukan evaluasi secara berkala karena kondisi keuangan, tanggung jawab keluarga, dan tujuan hidup dapat berubah seiring waktu. Apabila Anda ingin melakukan review lebih lanjut atau memiliki pertanyaan mengenai hasil simulasi ini, silakan hubungi saya, Septino, melalui tombol Konsultasi di bawah ini atau WhatsApp di <strong>0811-6946-999</strong>.</p>
      `;
      return;
    }

    box.innerHTML = `
      <p><strong>Berdasarkan simulasi, kebutuhan Dana Pensiun Anda diperkirakan sebesar ${required}, sedangkan dana terproyeksi saat pensiun baru mencapai ${projected}.</strong></p>
      <p>Biaya hidup saat pensiun dihitung dengan mempertimbangkan inflasi. Artinya, kebutuhan hidup yang terasa cukup hari ini kemungkinan akan menjadi jauh lebih besar ketika Anda memasuki masa pensiun.</p>
      <p>Kebutuhan dana menggunakan <strong>withdrawal rate ${Number(data.withdrawalRatePercent.toFixed(1))}% setelah pajak</strong>. Semakin kecil persentase yang dipilih, semakin besar dana pensiun yang perlu dipersiapkan agar kebutuhan hidup dapat tetap terpenuhi tanpa terlalu cepat menghabiskan pokok dana.</p>
      <p>Saat ini masih terdapat kekurangan sebesar <strong>${gap}</strong>. Dengan periode pengumpulan dana selama <strong>${formatYears(data.collectionYears)}</strong>, estimasi tambahan setoran yang perlu dipersiapkan sekitar <strong>${monthly} per bulan</strong>.</p>
      <p>Untuk membantu menutup kekurangan Dana Pensiun tersebut, silakan berkonsultasi dengan <strong>Financial Planner</strong> Anda agar memperoleh strategi pengumpulan dana dan besaran setoran yang sesuai dengan target usia pensiun serta kemampuan keuangan keluarga.</p>
      <p>Apabila Anda memerlukan diskusi atau pendampingan lebih lanjut mengenai hasil simulasi ini, saya dengan senang hati siap membantu. Silakan hubungi saya, Septino, melalui tombol Konsultasi di bawah ini atau WhatsApp di <strong>0811-6946-999</strong>.</p>
    `;
  }

  function calculateRetirement() {
    if (!validateModule("retirement")) return;
    const clientName = byId("retirementClientName")?.value.trim() || "";
    const maritalStatus =
      byId("retirementMaritalStatus")?.value || "Belum Menikah";
    const spouseName =
      maritalStatus === "Menikah"
        ? byId("retirementSpouseName")?.value.trim() || ""
        : "";
    const spouseAge =
      maritalStatus === "Menikah"
        ? Number(byId("retirementSpouseAge")?.value) || 0
        : 0;
    const currentAge = Number(byId("retirementCurrentAge")?.value) || 0;
    const retirementAge = Number(byId("retirementTargetAge")?.value) || 0;
    const monthlyExpense = parseCurrency(
      byId("retirementMonthlyExpense")?.value
    );
    const inflationRate =
      Number(byId("retirementInflationRate")?.value) || 0;
    const inflation = inflationRate / 100;
    const currentFund = parseCurrency(
      byId("retirementCurrentFund")?.value
    );
    const monthlyContribution = parseCurrency(
      byId("retirementMonthlyContribution")?.value
    );

    const yearsToRetirement = Math.max(
      retirementAge - currentAge,
      0
    );
    const collectionYears = getRetirementCollectionYears();

    if (
      currentAge <= 0 ||
      retirementAge <= currentAge ||
      monthlyExpense <= 0
    ) {
      alert(
        "Lengkapi usia saat ini, usia pensiun, dan biaya hidup bulanan dengan benar."
      );
      return;
    }

    if (!validateRetirementCollectionPeriod()) {
      return;
    }

    if (collectionYears <= 0 || collectionYears > yearsToRetirement) {
      alert(
        "Pilih periode pengumpulan dana yang tidak melebihi usia pensiun."
      );
      return;
    }

    const futureMonthlyExpense =
      monthlyExpense *
      Math.pow(1 + inflation, yearsToRetirement);

    const annualExpenseAtRetirement =
      futureMonthlyExpense * 12;

    const withdrawalRatePercent =
      Number(byId("retirementWithdrawalRate")?.value) || 4;
    const withdrawalRate = withdrawalRatePercent / 100;

    const requiredFund =
      withdrawalRate > 0
        ? annualExpenseAtRetirement / withdrawalRate
        : 0;

    const collectionMonths =
      collectionYears * 12;

    const projectedContribution =
      monthlyContribution * collectionMonths;

    const projectedFund =
      currentFund + projectedContribution;

    const fundingGap =
      Math.max(requiredFund - projectedFund, 0);

    const requiredMonthlyContribution =
      collectionMonths > 0
        ? fundingGap / collectionMonths
        : fundingGap;

    const readinessScore =
      requiredFund > 0
        ? Math.min(
            Math.round(projectedFund / requiredFund * 100),
            100
          )
        : 0;

    let readinessLabel = "Belum Siap";
    let statusClass = "status-gap";

    if (readinessScore >= 100) {
      readinessLabel = "Ideal";
      statusClass = "status-good";
    } else if (readinessScore >= 80) {
      readinessLabel = "Hampir Ideal";
      statusClass = "status-warning";
    } else if (readinessScore >= 50) {
      readinessLabel = "Perlu Ditingkatkan";
      statusClass = "status-warning";
    }

    state.retirement = {
      clientName,
      maritalStatus,
      spouseName,
      spouseAge,
      currentAge,
      retirementAge,
      monthlyExpense,
      inflationRate,
      yearsToRetirement,
      collectionYears,
      futureMonthlyExpense,
      annualExpenseAtRetirement,
      withdrawalRate,
      withdrawalRatePercent,
      currentFund,
      monthlyContribution,
      projectedContribution,
      projectedFund,
      fundingGap,
      requiredFund,
      requiredMonthlyContribution,
      readinessScore,
      readinessLabel
    };

    setResult(
      "retirementResult",
      requiredFund,
      `Biaya hidup tahun pertama saat pensiun ÷ ${Number(withdrawalRatePercent.toFixed(1))}%.`
    );

    if (byId("retirementYearsResult")) {
      byId("retirementYearsResult").textContent =
        formatYears(yearsToRetirement);
    }
    if (byId("retirementCollectionYearsResult")) {
      byId("retirementCollectionYearsResult").textContent =
        formatYears(collectionYears);
    }
    if (byId("retirementFutureExpenseResult")) {
      byId("retirementFutureExpenseResult").textContent =
        formatCurrency(futureMonthlyExpense);
    }
    if (byId("retirementAnnualExpenseResult")) {
      byId("retirementAnnualExpenseResult").textContent =
        formatCurrency(annualExpenseAtRetirement);
    }
    if (byId("retirementProjectedFundResult")) {
      byId("retirementProjectedFundResult").textContent =
        formatCurrency(projectedFund);
    }
    if (byId("retirementGapResult")) {
      byId("retirementGapResult").textContent =
        formatCurrency(fundingGap);
    }
    if (byId("retirementRecommendedMonthlyResult")) {
      byId("retirementRecommendedMonthlyResult").textContent =
        `${formatCurrency(requiredMonthlyContribution)} / bulan`;
    }
    if (byId("retirementReadinessScore")) {
      byId("retirementReadinessScore").textContent =
        readinessScore;
    }
    if (byId("retirementReadinessLabel")) {
      byId("retirementReadinessLabel").textContent =
        readinessLabel;
    }

    renderRetirementAnalysis(state.retirement);

    if (fundingGap <= 0) {
      setStatus(
        "retirementStatusBanner",
        "status-good",
        "Dana terproyeksi sudah memenuhi kebutuhan Dana Pensiun."
      );
    } else {
      setStatus(
        "retirementStatusBanner",
        statusClass,
        `Masih terdapat kekurangan Dana Pensiun sebesar ${formatCurrency(fundingGap)}.`
      );
    }
  }

  function openRetirementWhatsApp() {
    const data = state.retirement;

    if (!data || data.requiredFund <= 0) {
      alert("Silakan hitung kebutuhan Dana Pensiun terlebih dahulu.");
      return;
    }

    openWhatsApp([
      "Halo Septino,",
      "",
      "Saya sudah melakukan Simulasi Kebutuhan Dana Pensiun melalui website.",
      "",
      `Nama: ${data.clientName || "-"}`,
      `Status Pernikahan: ${data.maritalStatus}`,
      ...(data.maritalStatus === "Menikah"
        ? [
            `Nama Istri: ${data.spouseName || "-"}`,
            `Usia Istri: ${data.spouseAge || "-"} tahun`
          ]
        : []),
      `Usia Saat Ini: ${data.currentAge} tahun`,
      `Usia Pensiun: ${data.retirementAge} tahun`,
      `Menuju Pensiun: ${data.yearsToRetirement} tahun`,
      `Periode Pengumpulan Dana: ${data.collectionYears} tahun`,
      `Biaya Hidup Keluarga Saat Ini: ${formatCurrency(data.monthlyExpense)} / bulan`,
      `Inflasi: ${data.inflationRate}%`,
      `Withdrawal Rate Setelah Pajak: ${Number(data.withdrawalRatePercent.toFixed(1))}%`,
      `Biaya Hidup Saat Pensiun: ${formatCurrency(data.futureMonthlyExpense)} / bulan`,
      `Dana Pensiun Dibutuhkan: ${formatCurrency(data.requiredFund)}`,
      `Dana Terproyeksi: ${formatCurrency(data.projectedFund)}`,
      `Kekurangan Dana: ${formatCurrency(data.fundingGap)}`,
      `Setoran Bulanan Rekomendasi: ${formatCurrency(data.requiredMonthlyContribution)}`,
      `Readiness Score: ${data.readinessScore}/100 - ${data.readinessLabel}`,
      "",
      "Saya ingin berkonsultasi mengenai strategi Dana Pensiun."
    ].join("\n"));
  }

  let consultationRedirectPage = null;

  function openWhatsApp(message) {
    if (consultationRedirectPage) {
      const payload = {
        message,
        page: consultationRedirectPage,
        createdAt: Date.now()
      };

      sessionStorage.setItem(
        "septinoConsultationSimulation",
        JSON.stringify(payload)
      );

      const destination = consultationRedirectPage;
      consultationRedirectPage = null;
      window.location.href = `${destination}?from=simulation`;
      return;
    }

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener");
  }

  function openLifeWhatsApp() {
    const data = state.life;
    if (!data || data.idealCoverage <= 0) {
      alert("Silakan hitung kebutuhan Asuransi Jiwa terlebih dahulu.");
      return;
    }

    openWhatsApp([
      "Halo Septino,",
      "",
      "Saya sudah melakukan Simulasi Kebutuhan Asuransi Jiwa melalui website.",
      "",
      `Nama: ${data.insuredName || "-"}`,
      `Usia: ${data.insuredAge || "-"} tahun`,
      `Pengeluaran per bulan: ${formatCurrency(data.monthlyExpense)}`,
      `Pengeluaran tahunan: ${formatCurrency(data.annualExpense)}`,
      `Instrumen acuan: ${data.instrument}`,
      `Nett bunga: ${Number(data.netRate.toFixed(2))}%`,
      `UP Jiwa Ideal: ${formatCurrency(data.idealCoverage)}`,
      `UP Jiwa Saat Ini: ${formatCurrency(data.existingCoverage)}`,
      `Kekurangan UP: ${formatCurrency(data.gap)}`,
      "",
      "Saya ingin berkonsultasi mengenai premi Asuransi Jiwa."
    ].join("\n"));
  }

  function openCriticalWhatsApp() {
    const data = state.critical;
    if (!data || data.idealCoverage <= 0) {
      alert("Silakan hitung kebutuhan Penyakit Kritis terlebih dahulu.");
      return;
    }

    openWhatsApp([
      "Halo Septino,",
      "",
      "Saya sudah melakukan Simulasi Kebutuhan Penyakit Kritis melalui website.",
      "",
      `Nama: ${data.insuredName || "-"}`,
      `Usia: ${data.insuredAge || "-"} tahun`,
      `Penghasilan per bulan: ${formatCurrency(data.monthlyIncome)}`,
      `Penghasilan tahunan: ${formatCurrency(data.annualIncome)}`,
      `Multiplier: ${data.multiplier} tahun`,
      `UP Penyakit Kritis Ideal: ${formatCurrency(data.idealCoverage)}`,
      `UP Saat Ini: ${formatCurrency(data.existingCoverage)}`,
      `Kekurangan UP: ${formatCurrency(data.gap)}`,
      "",
      "Saya ingin berkonsultasi mengenai premi perlindungan Penyakit Kritis."
    ].join("\n"));
  }

  function openHealthWhatsApp() {
    if (!validateModule("health")) return;
    const data = calculateHealthQuestionnaire();

    if (!data) {
      alert("Silakan lengkapi Asuransi Kesehatan terlebih dahulu.");
      return;
    }

    const hasPrivateInsurance =
      data.hasPrivateInsurance === "Ya";

    let analysisMessage = "";
    let openingMessage = "";
    let closingRequest = "";

    if (hasPrivateInsurance) {
      openingMessage =
        "Saya baru saja menyelesaikan Asuransi Kesehatan di website Anda dan ingin melakukan review polis Asuransi Kesehatan yang saya miliki.";

      analysisMessage =
        data.status === "Proteksi Lengkap"
          ? "Saat ini saya sudah memiliki BPJS dan Asuransi Kesehatan Swasta. Saya ingin memastikan manfaat, area pertanggungan, tipe kamar, deductible, co-payment, dan ketentuan polis yang saya miliki masih sesuai dengan kebutuhan saya saat ini."
          : "Saat ini saya sudah memiliki Asuransi Kesehatan Swasta. Saya ingin mengetahui apakah polis yang saya miliki masih sesuai dengan kebutuhan dan apakah ada bagian yang perlu diperbaiki atau ditingkatkan.";

      closingRequest =
        "Mohon dibantu untuk melakukan review polis Asuransi Kesehatan saya.";
    } else {
      openingMessage =
        "Saya baru saja menyelesaikan Asuransi Kesehatan di website Anda dan ingin berkonsultasi mengenai premi Asuransi Kesehatan.";

      analysisMessage =
        data.status === "Prioritas Tinggi"
          ? "Berdasarkan hasil kuisioner, saya belum memiliki perlindungan kesehatan yang memadai. Saya ingin mendapatkan rekomendasi mengenai perlindungan yang sesuai dengan kebutuhan dan kemampuan finansial saya."
          : "Saat ini saya belum memiliki Asuransi Kesehatan Swasta. Saya ingin mengetahui pilihan perlindungan dan estimasi premi yang sesuai dengan kebutuhan serta kemampuan finansial saya.";

      closingRequest =
        "Mohon dibantu memberikan rekomendasi dan estimasi premi Asuransi Kesehatan.";
    }

    const lines = [
      "Halo Septino,",
      "",
      openingMessage,
      "",
      "━━━━━━━━━━━━━━━━━━",
      "DATA SAYA",
      "━━━━━━━━━━━━━━━━━━",
      "",
      `Nama : ${data.insuredName || "-"}`,
      `Usia : ${data.insuredAge || "-"} Tahun`,
      "",
      "━━━━━━━━━━━━━━━━━━",
      "PERLINDUNGAN SAAT INI",
      "━━━━━━━━━━━━━━━━━━",
      "",
      `BPJS : ${data.bpjsStatus}`,
      `Asuransi Swasta : ${data.hasPrivateInsurance}`,
      `Coverage Area : ${data.coverageArea || "-"}`,
      `Tipe Kamar : ${data.roomType || "-"}`,
      `Cashless : ${data.cashless || "-"}`,
      `Deductible : ${formatHealthDeductible(data.deductible)}`,
      `Co-payment : ${formatHealthCopayment(data.copayment)}`,
      `Riwayat Penyakit : ${data.medicalHistory}`,
      `Pernah Ditolak / Ditunda : ${data.insuranceRejection}`,
      "",
      "━━━━━━━━━━━━━━━━━━",
      "HASIL ANALISIS",
      "━━━━━━━━━━━━━━━━━━",
      "",
      `Status Perlindungan : ${data.status}`,
      "",
      "Catatan Financial & Insurance Planner :",
      "",
      analysisMessage,
      "",
      closingRequest,
      "",
      "Terima kasih."
    ];

    if (data.medicalHistory === "Ada" && data.medicalHistoryNotes) {
      const index = lines.indexOf(
        `Pernah Ditolak / Ditunda : ${data.insuranceRejection}`
      );
      lines.splice(
        index,
        0,
        `Keterangan Riwayat Penyakit : ${data.medicalHistoryNotes}`
      );
    }

    if (
      data.insuranceRejection === "Ya" &&
      data.insuranceRejectionNotes
    ) {
      const resultIndex = lines.indexOf("HASIL ANALISIS");
      lines.splice(
        resultIndex - 1,
        0,
        `Keterangan Penolakan / Penundaan : ${data.insuranceRejectionNotes}`,
        ""
      );
    }

    openWhatsApp(lines.join("\n"));
  }

  function openEducationWhatsApp() {
    const data = state.education;

    if (!data || data.targetFund <= 0) {
      alert("Silakan hitung kebutuhan Dana Pendidikan terlebih dahulu.");
      return;
    }

    openWhatsApp([
      "Halo Septino,",
      "",
      "Saya sudah melakukan Simulasi Kebutuhan Dana Pendidikan melalui website.",
      "",
      `Nama Ayah: ${data.fatherName || "-"}`,
      `Nama Ibu: ${data.motherName || "-"}`,
      `Nama Anak: ${data.childName || "-"}`,
      `Target pendidikan: ${data.targetLabel}`,
      `Sisa waktu: ${formatYears(data.remainingYears)}`,
      `Dana dibutuhkan: ${formatCurrency(data.targetFund)}`,
      `Dana saat ini: ${formatCurrency(data.existingFund)}`,
      `Kekurangan dana: ${formatCurrency(data.gap)}`,
      `Estimasi setoran: ${formatCurrency(data.monthlyContribution)} / bulan`,
      `Strategi: ${data.strategyLabel}`,
      "",
      "Saya ingin berkonsultasi mengenai strategi Dana Pendidikan."
    ].join("\n"));
  }


  function openEmergencyWhatsApp() {
    const data = state.emergency;

    if (!data || data.idealFund <= 0) {
      alert("Silakan hitung kebutuhan Dana Darurat terlebih dahulu.");
      return;
    }

    openWhatsApp([
      "Halo Septino,",
      "",
      "Saya sudah melakukan Simulasi Kebutuhan Dana Darurat melalui website.",
      "",
      `Nama: ${data.clientName || "-"}`,
      `Usia: ${data.clientAge} tahun`,
      `Status Pernikahan: ${data.maritalStatus}`,
      ...(data.maritalStatus === "Menikah"
        ? [
            `Nama Istri: ${data.spouseName || "-"}`,
            `Usia Istri: ${data.spouseAge} tahun`,
            `Jumlah Anak: ${data.childCount} anak`
          ]
        : []),
      `Pengeluaran Keluarga: ${formatCurrency(data.monthlyExpense)} / bulan`,
      `Multiplier: ${data.multiplier} bulan`,
      `Dana Darurat Ideal: ${formatCurrency(data.idealFund)}`,
      `Dana Darurat Saat Ini: ${formatCurrency(data.existingFund)}`,
      `Kekurangan Dana: ${formatCurrency(data.gap)}`,
      `Rasio Terpenuhi: ${Math.round(data.ratio)}%`,
      "",
      "Saya ingin berkonsultasi mengenai strategi pembentukan Dana Darurat."
    ].join("\n"));
  }

  function openSimulationWhatsApp() {
    const tab = getActiveTab();

    if (tab === "emergency") return;

    const servicePages = {
      life: "asuransi-jiwa.html",
      critical: "penyakit-kritis.html",
      health: "asuransi-kesehatan.html",
      education: "dana-pendidikan.html",
      retirement: "dana-pensiun.html"
    };

    consultationRedirectPage = servicePages[tab] || null;
    if (!consultationRedirectPage) return;

    if (tab === "critical") {
      openCriticalWhatsApp();
    } else if (tab === "health") {
      openHealthWhatsApp();
    } else if (tab === "education") {
      openEducationWhatsApp();
    } else if (tab === "retirement") {
      openRetirementWhatsApp();
    } else {
      openLifeWhatsApp();
    }
  }


  function getPdfEngine() {
    return window.jspdf?.jsPDF || null;
  }

  function sanitizeFileName(value) {
    return String(value || "laporan")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "laporan";
  }

  function pdfText(doc, text, x, y, options = {}) {
    const width = options.width || 170;
    const fontSize = options.fontSize || 10;
    const style = options.style || "normal";
    const lineHeight = options.lineHeight || 5.2;

    doc.setFont("helvetica", style);
    doc.setFontSize(fontSize);

    const lines = doc.splitTextToSize(String(text ?? "-"), width);
    doc.text(lines, x, y);

    return y + lines.length * lineHeight;
  }

  function addPdfHeader(doc, title, subtitle) {
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(12, 12, 186, 30, 5, 5, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text(title, 18, 25);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(subtitle, 18, 33);

    doc.setTextColor(15, 23, 42);
  }

  function addPdfFooter(doc) {
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 16, 196, pageHeight - 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "Septino, QWP, CIS - Financial & Insurance Planner",
      14,
      pageHeight - 10
    );
  }

  function addPdfSection(doc, title, rows, startY) {
    let y = startY;

    if (y > 255) {
      addPdfFooter(doc);
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(239, 246, 255);
    doc.roundedRect(14, y, 182, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(29, 78, 216);
    doc.text(title, 18, y + 6.5);
    y += 15;

    rows.forEach(([label, value]) => {
      if (y > 270) {
        addPdfFooter(doc);
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(String(label), 18, y);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      const wrapped = doc.splitTextToSize(String(value ?? "-"), 105);
      doc.text(wrapped, 85, y);
      y += Math.max(7, wrapped.length * 5);
    });

    return y + 4;
  }

  function getPlainAnalysis(elementId) {
    const element = byId(elementId);
    return element ? element.innerText.trim() : "-";
  }

  function buildLifePdfData() {
    const data = state.life;
    if (!data || data.idealCoverage <= 0) {
      alert("Silakan hitung kebutuhan Asuransi Jiwa terlebih dahulu.");
      return null;
    }

    return {
      title: "Simulasi Kebutuhan Asuransi Jiwa",
      fileName: `asuransi-jiwa-${sanitizeFileName(data.insuredName)}`,
      sections: [
        ["Data Tertanggung", [
          ["Nama", data.insuredName || "-"],
          ["Usia", `${data.insuredAge || "-"} tahun`],
          ["Pengeluaran Keluarga / Bulan", formatCurrency(data.monthlyExpense)]
        ]],
        ["Hasil Simulasi", [
          ["Pengeluaran Tahunan", formatCurrency(data.annualExpense)],
          ["Instrumen Acuan", data.instrument],
          ["Nett Bunga", `${Number(data.netRate.toFixed(2))}%`],
          ["UP Jiwa Ideal", formatCurrency(data.idealCoverage)],
          ["UP Jiwa Saat Ini", formatCurrency(data.existingCoverage)],
          ["Kekurangan UP Jiwa", formatCurrency(data.gap)],
          ["Rasio Terpenuhi", `${Math.round(data.ratio)}%`]
        ]],
        ["Analisis Financial & Insurance Planner", [
          ["Analisis", getPlainAnalysis("lifeAnalysisText")]
        ]]
      ]
    };
  }

  function buildCriticalPdfData() {
    const data = state.critical;
    if (!data || data.idealCoverage <= 0) {
      alert("Silakan hitung kebutuhan Penyakit Kritis terlebih dahulu.");
      return null;
    }

    return {
      title: "Simulasi Kebutuhan Penyakit Kritis",
      fileName: `penyakit-kritis-${sanitizeFileName(data.insuredName)}`,
      sections: [
        ["Data Tertanggung", [
          ["Nama", data.insuredName || "-"],
          ["Usia", `${data.insuredAge || "-"} tahun`],
          ["Penghasilan / Bulan", formatCurrency(data.monthlyIncome)]
        ]],
        ["Hasil Simulasi", [
          ["Penghasilan Tahunan", formatCurrency(data.annualIncome)],
          ["Multiplier", `${data.multiplier} tahun`],
          ["UP Penyakit Kritis Ideal", formatCurrency(data.idealCoverage)],
          ["UP Saat Ini", formatCurrency(data.existingCoverage)],
          ["Kekurangan UP", formatCurrency(data.gap)],
          ["Rasio Terpenuhi", `${Math.round(data.ratio)}%`],
          ["Status", data.status]
        ]],
        ["Analisis Financial & Insurance Planner", [
          ["Analisis", getPlainAnalysis("criticalAnalysisText")]
        ]]
      ]
    };
  }

  function buildHealthPdfData() {
    if (!validateModule("health")) return null;
    const data = calculateHealthQuestionnaire();
    if (!data) return null;

    return {
      title: "Laporan Asuransi Kesehatan",
      fileName: `asuransi-kesehatan-${sanitizeFileName(data.insuredName)}`,
      sections: [
        ["Data Tertanggung", [
          ["Nama", data.insuredName || "-"],
          ["Usia", `${data.insuredAge || "-"} tahun`]
        ]],
        ["Perlindungan Saat Ini", [
          ["BPJS", data.bpjsStatus],
          ["Asuransi Swasta", data.hasPrivateInsurance],
          ["Coverage Area", data.coverageArea || "-"],
          ["Tipe Kamar", data.roomType || "-"],
          ["Cashless", data.cashless || "-"],
          ["Deductible", formatHealthDeductible(data.deductible)],
          ["Co-payment", formatHealthCopayment(data.copayment)],
          ["Riwayat Penyakit", data.medicalHistory],
          ["Pernah Ditolak / Ditunda", data.insuranceRejection]
        ]],
        ["Hasil Analisis", [
          ["Status Perlindungan", data.status],
          ["Analisis", getPlainAnalysis("healthAnalysisText")],
          ["Catatan Penting",
           "Asuransi kesehatan perlu direview secara berkala untuk memastikan manfaat dan ketentuan polis masih sesuai dengan kebutuhan saat ini."]
        ]]
      ]
    };
  }

  function buildEducationPdfData() {
    const data = state.education;
    if (!data || data.targetFund <= 0) {
      alert("Silakan hitung kebutuhan Dana Pendidikan terlebih dahulu.");
      return null;
    }

    return {
      title: "Simulasi Perencanaan Dana Pendidikan",
      fileName: `dana-pendidikan-${sanitizeFileName(data.childName)}`,
      sections: [
        ["Data Keluarga", [
          ["Nama Ayah", data.fatherName || "-"],
          ["Usia Ayah", `${data.fatherAge || "-"} tahun`],
          ["Nama Ibu", data.motherName || "-"],
          ["Usia Ibu", `${data.motherAge || "-"} tahun`],
          ["Usia Pensiun yang Diinginkan", `${data.retirementAge} tahun`],
          ["Nama Anak", data.childName || "-"],
          ["Usia Anak", `${data.currentAge} tahun`],
          ["Target Pendidikan", data.targetLabel],
          ["Usia Masuk", `${data.entryAge} tahun`]
        ]],
        ["Hasil Simulasi", [
          ["Biaya Pendidikan Saat Ini", formatCurrency(data.currentCost)],
          ["Inflasi Pendidikan", `${Number((data.inflation * 100).toFixed(1))}%`],
          ["Sisa Waktu", formatYears(data.remainingYears)],
          ["Periode Maksimum", formatYears(data.maxPeriod)],
          ["Periode Persiapan", formatYears(data.preparationYears)],
          ["Dana Dibutuhkan", formatCurrency(data.targetFund)],
          ["Dana Sudah Ada", formatCurrency(data.existingFund)],
          ["Kekurangan Dana", formatCurrency(data.gap)],
          ["Setoran Bulanan", formatCurrency(data.monthlyContribution)],
          ["Strategi", data.strategyLabel]
        ]],
        ["Analisis Financial & Insurance Planner", [
          ["Analisis", getPlainAnalysis("educationAnalysisText")]
        ]]
      ]
    };
  }

  function buildRetirementPdfData() {
    const data = state.retirement;
    if (!data || data.requiredFund <= 0) {
      alert("Silakan hitung kebutuhan Dana Pensiun terlebih dahulu.");
      return null;
    }

    const familyRows = [
      ["Nama", data.clientName || "-"],
      ["Status Pernikahan", data.maritalStatus],
      ["Usia Saat Ini", `${data.currentAge} tahun`],
      ["Usia Pensiun yang Diinginkan", `${data.retirementAge} tahun`]
    ];

    if (data.maritalStatus === "Menikah") {
      familyRows.splice(
        2,
        0,
        ["Nama Istri", data.spouseName || "-"],
        ["Usia Istri", `${data.spouseAge || "-"} tahun`]
      );
    }

    return {
      title: "Simulasi Perencanaan Dana Pensiun",
      fileName: `dana-pensiun-${sanitizeFileName(data.clientName)}`,
      sections: [
        ["Data Keluarga", familyRows],
        ["Hasil Simulasi", [
          ["Menuju Pensiun", formatYears(data.yearsToRetirement)],
          ["Periode Pengumpulan Dana", formatYears(data.collectionYears)],
          ["Biaya Hidup Keluarga Saat Ini", formatCurrency(data.monthlyExpense)],
          ["Inflasi", `${data.inflationRate}%`],
          ["Withdrawal Rate Setelah Pajak", `${Number(data.withdrawalRatePercent.toFixed(1))}%`],
          ["Biaya Hidup Saat Pensiun", formatCurrency(data.futureMonthlyExpense)],
          ["Dana Pensiun Dibutuhkan", formatCurrency(data.requiredFund)],
          ["Dana Terproyeksi", formatCurrency(data.projectedFund)],
          ["Kekurangan Dana", formatCurrency(data.fundingGap)],
          ["Setoran Bulanan Rekomendasi", formatCurrency(data.requiredMonthlyContribution)],
          ["Readiness Score", `${data.readinessScore}/100 - ${data.readinessLabel}`]
        ]],
        ["Analisis Financial & Insurance Planner", [
          ["Analisis", getPlainAnalysis("retirementAnalysisText")]
        ]]
      ]
    };
  }


  function buildEmergencyPdfData() {
    const data = state.emergency;

    if (!data || data.idealFund <= 0) {
      alert("Silakan hitung kebutuhan Dana Darurat terlebih dahulu.");
      return null;
    }

    const familyRows = [
      ["Nama", data.clientName || "-"],
      ["Usia", `${data.clientAge} tahun`],
      ["Status Pernikahan", data.maritalStatus]
    ];

    if (data.maritalStatus === "Menikah") {
      familyRows.push(
        ["Nama Istri", data.spouseName || "-"],
        ["Usia Istri", `${data.spouseAge} tahun`],
        ["Jumlah Anak", `${data.childCount} anak`]
      );
    }

    return {
      title: "Simulasi Perencanaan Dana Darurat",
      fileName: `dana-darurat-${sanitizeFileName(data.clientName)}`,
      sections: [
        ["Data Pribadi", familyRows],
        ["Hasil Simulasi", [
          ["Pengeluaran Keluarga / Bulan", formatCurrency(data.monthlyExpense)],
          ["Multiplier", `${data.multiplier} bulan`],
          ["Dana Darurat Ideal", formatCurrency(data.idealFund)],
          ["Dana Darurat Saat Ini", formatCurrency(data.existingFund)],
          ["Kekurangan Dana", formatCurrency(data.gap)],
          ["Rasio Terpenuhi", `${Math.round(data.ratio)}%`]
        ]],
        ["Analisis Financial & Insurance Planner", [
          ["Analisis", getPlainAnalysis("emergencyAnalysisText")]
        ]]
      ]
    };
  }

  function getModulePdfData(module) {
    const builders = {
      life: buildLifePdfData,
      critical: buildCriticalPdfData,
      health: buildHealthPdfData,
      education: buildEducationPdfData,
      retirement: buildRetirementPdfData,
      emergency: buildEmergencyPdfData
    };

    return builders[module]?.() || null;
  }


  function addPdfAnalysisPages(doc, reportTitle, analysisText) {
    const pageHeight = doc.internal.pageSize.getHeight();
    const left = 18;
    const maxWidth = 174;
    const bottomLimit = pageHeight - 24;

    doc.addPage();
    addPdfHeader(
      doc,
      "Laporan Analisis",
      reportTitle
    );

    let y = 54;

    doc.setFillColor(239, 246, 255);
    doc.roundedRect(14, y, 182, 12, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(29, 78, 216);
    doc.text(
      "Analisis Financial & Insurance Planner",
      left,
      y + 7.7
    );
    y += 20;

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const paragraphs = String(analysisText || "-")
      .split(/\n+/)
      .map(item => item.trim())
      .filter(Boolean);

    paragraphs.forEach((paragraph, paragraphIndex) => {
      const lines = doc.splitTextToSize(paragraph, maxWidth);

      lines.forEach((line) => {
        if (y > bottomLimit) {
          addPdfFooter(doc);
          doc.addPage();
          addPdfHeader(
            doc,
            "Laporan Analisis",
            reportTitle
          );
          y = 54;
          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
        }

        doc.text(line, left, y);
        y += 5.6;
      });

      if (paragraphIndex < paragraphs.length - 1) {
        y += 4;
      }
    });

    addPdfFooter(doc);
  }

  function createModulePdf(module) {
    const jsPDF = getPdfEngine();

    if (!jsPDF) {
      alert("Library PDF belum selesai dimuat. Silakan coba kembali.");
      return null;
    }

    const data = getModulePdfData(module);
    if (!data) return null;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    addPdfHeader(
      doc,
      data.title,
      "Septino, QWP, CIS - Financial & Insurance Planner"
    );

    let y = 52;

    const separateAnalysisPage = [
      "life",
      "critical",
      "health",
      "education",
      "retirement",
      "emergency"
    ].includes(module);

    const regularSections = separateAnalysisPage
      ? data.sections.filter(
          ([title]) =>
            title !== "Analisis Financial & Insurance Planner"
        )
      : data.sections;

    regularSections.forEach(([title, rows]) => {
      y = addPdfSection(doc, title, rows, y);
    });

    addPdfFooter(doc);

    if (separateAnalysisPage) {
      const analysisSection = data.sections.find(
        ([title]) =>
          title === "Analisis Financial & Insurance Planner"
      );

      const analysisText =
        analysisSection?.[1]?.find(
          ([label]) => label === "Analisis"
        )?.[1] || "-";

      addPdfAnalysisPages(
        doc,
        data.title,
        analysisText
      );
    }

    return {
      doc,
      data,
      fileName: `${data.fileName}.pdf`
    };
  }

  function exportModulePdf(module) {
    if (!validateModule(module)) return;
    const result = createModulePdf(module);
    if (!result) return;
    result.doc.save(result.fileName);
  }

  function getActiveModuleForShare() {
    return getActiveTab();
  }

  async function sharePdfWithConsultation(module, message) {
    if (!validateModule(module)) return true;
    const result = createModulePdf(module);
    if (!result) return false;

    const blob = result.doc.output("blob");
    const file = new File(
      [blob],
      result.fileName,
      { type: "application/pdf" }
    );

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          title: result.data.title,
          text: message,
          files: [file]
        });
        return true;
      } catch (error) {
        if (error?.name === "AbortError") return true;
      }
    }

    result.doc.save(result.fileName);
    return false;
  }

  function initialize() {
    initializeTabs();
    initializeCurrencyInputs();
    initializeValidationCleanup();
    calculateLifePreview();
    updateCriticalAnnualPreview();
    updateEducationPeriodOptions();
    updateHealthConditionalFields();

    document.querySelectorAll(
      '#health-panel input, #health-panel select, #health-panel textarea'
    ).forEach((element) => {
      element.addEventListener("input", calculateHealthQuestionnaire);
      element.addEventListener("change", calculateHealthQuestionnaire);
    });

    [
      "educationFatherAge",
      "educationMotherAge",
      "educationRetirementAge",
      "educationCurrentAge",
      "educationEntryAge"
    ].forEach((id) => {
      const element = byId(id);
      if (!element) return;

      element.addEventListener("input", updateEducationPeriodOptions);
      element.addEventListener("change", updateEducationPeriodOptions);
    });

    byId("educationCustomYears")?.addEventListener(
      "input",
      validateEducationCustomPeriod
    );

    updateRetirementYearsPreview();

    [
      "retirementCurrentAge",
      "retirementTargetAge"
    ].forEach((id) => {
      const element = byId(id);
      if (!element) return;
      element.addEventListener("input", updateRetirementYearsPreview);
      element.addEventListener("change", updateRetirementYearsPreview);
    });

    byId("retirementCustomYears")?.addEventListener(
      "input",
      validateRetirementCollectionPeriod
    );

    updateRetirementCollectionOptions();
    updateRetirementSpouseFields();
    updateEmergencySpouseFields();

    byId("emergencyChildCount")?.addEventListener(
      "input",
      updateEmergencySpouseFields
    );
    byId("emergencyChildCount")?.addEventListener(
      "change",
      updateEmergencySpouseFields
    );

    updateWhatsappLabel(getActiveTab());

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  window.calculateLife = calculateLife;
  window.calculateCritical = calculateCritical;
  window.calculateHealthQuestionnaire = calculateHealthQuestionnaire;
  window.updateHealthConditionalFields = updateHealthConditionalFields;
  window.calculateEducation = calculateEducation;
  window.calculateRetirement = calculateRetirement;
  window.toggleRetirementCustomPeriod = toggleRetirementCustomPeriod;
  window.updateRetirementSpouseFields = updateRetirementSpouseFields;
  window.calculateEmergency = calculateEmergency;
  window.updateEmergencySpouseFields = updateEmergencySpouseFields;
  window.updateEmergencyMultiplierOptions = updateEmergencyMultiplierOptions;
  window.syncEducationTarget = syncEducationTarget;
  window.toggleEducationCustomPeriod = toggleEducationCustomPeriod;
  window.calculateLifePreview = calculateLifePreview;
  window.syncLifeTax = syncLifeTax;
  window.openSimulationWhatsApp = openSimulationWhatsApp;
  window.exportModulePdf = exportModulePdf;
  window.validateModule = validateModule;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
