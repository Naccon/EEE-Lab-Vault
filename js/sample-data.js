(function bootstrapSampleData(global) {
  const ns = global.EEEVault = global.EEEVault || {};
  const utils = ns.utils;
  const config = ns.config;

  function buildCircuitSvg(label, accentColor) {
    return utils.toDataUrlFromSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 280">
        <rect width="640" height="280" fill="#08131e"/>
        <g fill="none" stroke="${accentColor}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <line x1="60" y1="140" x2="160" y2="140"/>
          <rect x="160" y="110" width="70" height="60"/>
          <line x1="230" y1="140" x2="320" y2="140"/>
          <rect x="320" y="110" width="70" height="60"/>
          <line x1="390" y1="140" x2="490" y2="140"/>
          <rect x="490" y="110" width="70" height="60"/>
          <line x1="60" y1="140" x2="60" y2="230"/>
          <line x1="560" y1="140" x2="560" y2="230"/>
          <line x1="60" y1="230" x2="560" y2="230"/>
          <line x1="60" y1="70" x2="60" y2="140"/>
          <circle cx="60" cy="140" r="8" fill="${accentColor}"/>
          <circle cx="560" cy="140" r="8" fill="${accentColor}"/>
        </g>
        <g fill="${accentColor}" font-family="monospace" font-size="18">
          <text x="194" y="148">R1</text>
          <text x="354" y="148">R2</text>
          <text x="523" y="148">RL</text>
          <text x="45" y="52">Vs</text>
          <text x="250" y="70">${label}</text>
        </g>
      </svg>`
    );
  }

  function createReport(overrides) {
    const base = {
      id: utils.uid("report"),
      title: "",
      categoryId: "circuits",
      status: "published",
      summary: "",
      experimentNo: "EXP-01",
      experimentDate: "2026-03-01",
      createdAt: "2026-03-01T09:00:00.000Z",
      updatedAt: "2026-03-01T09:00:00.000Z",
      authorId: "user-student",
      featured: false,
      lockAcademicFields: false,
      student: utils.deepClone(config.defaultStudentProfile),
      academic: {
        subjectName: "Circuit Analysis",
        subjectCode: "EEE 2103",
        teacherName: "Md. Rakib Hasan",
        teacherDesignation: "Associate Professor, Department of EEE"
      },
      sections: {
        objective: "",
        theory: "",
        apparatus: "",
        procedure: "",
        result: "",
        conclusion: "",
        references: ""
      },
      circuitDiagram: {
        dataUrl: "",
        caption: ""
      },
      dataTable: {
        headers: ["Parameter", "Measured", "Calculated", "Remarks"],
        rows: []
      },
      versions: []
    };

    return Object.assign(base, overrides);
  }

  function createCohortUsers(maxUsers, existingUsers) {
    const users = utils.deepClone(existingUsers || []);
    const remaining = Math.max(0, (maxUsers || config.maxUsers) - users.length);
    const firstNames = ["Arafat", "Sadia", "Tanzim", "Morshed", "Rafi", "Nusrat", "Arman", "Tahsin", "Fariha", "Mahim"];
    const lastNames = ["Rahman", "Ahmed", "Karim", "Hasan", "Sultana", "Islam", "Hossain", "Kabir", "Akter", "Chowdhury"];

    for (let index = 1; index <= remaining; index += 1) {
      const serial = String(index).padStart(3, "0");
      const first = firstNames[(index - 1) % firstNames.length];
      const last = lastNames[(index - 1) % lastNames.length];
      const level = config.levelOptions[(index - 1) % config.levelOptions.length];
      const term = config.termOptions[(index - 1) % config.termOptions.length];

      users.push({
        id: `user-cohort-${serial}`,
        username: `student${serial}@vault.local`,
        email: `student${serial}@vault.local`,
        studentId: `2024-EEE-${serial}`,
        loginSecret: `2024-EEE-${serial}`,
        name: `${first} ${last}`,
        role: "Student Researcher",
        roleKey: "student",
        department: "Department of Electrical and Electronic Engineering",
        accessMode: index % 5 === 0 ? "read" : "edit",
        level,
        term,
        section: index % 2 === 0 ? "Section A" : "Section B",
        status: "active"
      });
    }

    return users.slice(0, config.maxUsers);
  }

  function seedReports() {
    return [
      createReport({
        id: "report-featured",
        title: "Verification of Thevenin and Norton Theorem",
        categoryId: "circuits",
        status: "published",
        featured: true,
        summary: "Experimental verification of equivalent circuit theorems using a resistive DC network and load variation analysis.",
        experimentNo: "EXP-04",
        experimentDate: "2026-03-12",
        createdAt: "2026-03-12T08:30:00.000Z",
        updatedAt: "2026-03-16T15:20:00.000Z",
        lockAcademicFields: true,
        academic: {
          subjectName: "Circuit Analysis",
          subjectCode: "EEE 2103",
          teacherName: "Md. Rakib Hasan",
          teacherDesignation: "Associate Professor, Department of EEE"
        },
        sections: {
          objective: "To verify Thevenin's theorem and Norton's theorem experimentally, and compare measured load response with theoretical predictions.",
          theory: "Any linear bilateral network can be reduced to an equivalent voltage source and series resistance or a current source and parallel resistance. Thevenin and Norton forms are duals of one another, where IN = VTH / RTH and RN = RTH.",
          apparatus: "DC power supply, breadboard, resistors, digital multimeter, jumper wires, and load resistance set.",
          procedure: "Construct the network, measure open-circuit voltage, determine equivalent resistance, replace the network with Thevenin and Norton equivalents, and compare load voltage for multiple RL values.",
          result: "Measured values closely matched calculated values for all selected load resistances. Maximum deviation stayed below 0.5%, validating the equivalence models.",
          conclusion: "The experiment confirmed that both Thevenin and Norton equivalents reproduce identical terminal behavior for the same load. Differences were mainly due to resistor tolerance and instrumentation limits.",
          references: "Laboratory manual for Circuit Analysis; standard equivalent network theorem notes."
        },
        circuitDiagram: {
          dataUrl: buildCircuitSvg("THEVENIN / NORTON", "#00d4ff"),
          caption: "FIG. 01 - DC equivalent circuit setup for theorem verification"
        },
        dataTable: {
          headers: ["RL (kOhm)", "Measured Vload", "Calculated Vload", "Error"],
          rows: [
            ["1.0", "4.02 V", "4.00 V", "0.5%"],
            ["2.2", "5.86 V", "5.87 V", "0.17%"],
            ["4.7", "7.41 V", "7.43 V", "0.27%"],
            ["10.0", "8.88 V", "8.89 V", "0.11%"]
          ]
        }
      }),
      createReport({
        id: "report-kvl",
        title: "KVL and KCL Verification in Series-Parallel Circuits",
        categoryId: "circuits",
        status: "published",
        summary: "Kirchhoff's laws verification through measured node currents and loop voltages in a resistive network.",
        experimentNo: "EXP-01",
        experimentDate: "2026-01-20",
        createdAt: "2026-01-20T07:30:00.000Z",
        updatedAt: "2026-01-20T10:40:00.000Z",
        authorId: "user-cohort-001",
        sections: {
          objective: "To validate Kirchhoff's Voltage Law and Kirchhoff's Current Law experimentally using a series-parallel resistor network.",
          theory: "KVL states that the algebraic sum of voltages in a closed loop is zero. KCL states that the algebraic sum of currents entering and leaving a node is zero.",
          apparatus: "Breadboard, DC source, resistor set, ammeter, voltmeter, wiring leads.",
          procedure: "Construct the circuit, record branch currents, record loop voltages, and compare algebraic sums with theoretical expectations.",
          result: "Loop voltage sum error remained below 1.0%, and node current mismatch remained below 0.8% across all observations.",
          conclusion: "Measured data verified both Kirchhoff's laws and confirmed conservation of energy and charge in the network.",
          references: "Circuit Analysis lab sheet."
        },
        circuitDiagram: {
          dataUrl: buildCircuitSvg("KVL / KCL", "#00ff88"),
          caption: "FIG. 02 - Series-parallel verification setup"
        },
        dataTable: {
          headers: ["Loop / Node", "Measured Sum", "Expected Sum", "Observation"],
          rows: [
            ["Loop 1", "0.08 V", "0 V", "Within tolerance"],
            ["Loop 2", "0.05 V", "0 V", "Within tolerance"],
            ["Node A", "0.11 mA", "0 mA", "Within tolerance"]
          ]
        }
      }),
      createReport({
        id: "report-diode",
        title: "I-V Characteristics of a PN Junction Diode",
        categoryId: "electronics",
        status: "published",
        summary: "Forward and reverse bias analysis of a PN junction diode with characteristic curve observation.",
        experimentNo: "EXP-01",
        experimentDate: "2026-01-28",
        createdAt: "2026-01-28T08:10:00.000Z",
        updatedAt: "2026-02-01T11:30:00.000Z",
        authorId: "user-cohort-002",
        academic: {
          subjectName: "Electronics I",
          subjectCode: "EEE 2201",
          teacherName: "Sharmin Akter",
          teacherDesignation: "Assistant Professor, Department of EEE"
        },
        sections: {
          objective: "To observe the forward and reverse I-V characteristics of a PN junction diode and estimate knee voltage.",
          theory: "A PN junction conducts significantly after the barrier potential is overcome. In reverse bias, current remains very small until breakdown.",
          apparatus: "DC source, diode, resistor, ammeter, voltmeter, breadboard.",
          procedure: "Vary the source voltage in small increments, record diode current and voltage for forward bias, then repeat for reverse bias.",
          result: "The diode showed exponential conduction after the knee region and negligible reverse current before breakdown.",
          conclusion: "Experimental data aligned with standard semiconductor junction behavior and confirmed the nonlinear nature of diode conduction.",
          references: "Electronics I lab manual."
        },
        dataTable: {
          headers: ["Bias", "Voltage", "Current", "Remark"],
          rows: [
            ["Forward", "0.62 V", "6.8 mA", "Near knee"],
            ["Forward", "0.71 V", "12.4 mA", "Strong conduction"],
            ["Reverse", "5.00 V", "0.02 mA", "Leakage only"]
          ]
        }
      }),
      createReport({
        id: "report-power-factor",
        title: "Measurement of Power Factor in AC Circuits",
        categoryId: "power",
        status: "published",
        summary: "Real, reactive, and apparent power measurements used to evaluate power factor in an AC load.",
        experimentNo: "EXP-01",
        experimentDate: "2026-02-25",
        createdAt: "2026-02-25T08:50:00.000Z",
        updatedAt: "2026-03-02T13:00:00.000Z",
        authorId: "user-cohort-003",
        academic: {
          subjectName: "Power Systems",
          subjectCode: "EEE 3205",
          teacherName: "Syed Abrar Hossain",
          teacherDesignation: "Professor, Department of EEE"
        },
        sections: {
          objective: "To measure real, reactive, and apparent power and determine the power factor of a single-phase AC circuit.",
          theory: "Power factor is the cosine of the phase angle between voltage and current. Lagging loads decrease power factor and increase apparent power demand.",
          apparatus: "Single-phase AC source, wattmeter, ammeter, voltmeter, RL load.",
          procedure: "Connect the measuring instruments, apply rated voltage, record voltage, current, and wattmeter reading, and compute apparent power and power factor.",
          result: "Measured power factor indicated a lagging inductive load with acceptable error compared to calculated values.",
          conclusion: "The experiment demonstrated the relation between phase shift and usable power in AC systems.",
          references: "Power Systems laboratory notes."
        },
        dataTable: {
          headers: ["Voltage", "Current", "Real Power", "Power Factor"],
          rows: [
            ["220 V", "1.10 A", "190 W", "0.79"],
            ["220 V", "1.24 A", "215 W", "0.79"]
          ]
        }
      }),
      createReport({
        id: "report-filter",
        title: "RC Low-pass Filter Frequency Response",
        categoryId: "signals",
        status: "published",
        summary: "Frequency response analysis of a first-order RC low-pass filter with observed cutoff behavior.",
        experimentNo: "EXP-01",
        experimentDate: "2026-02-10",
        createdAt: "2026-02-10T09:20:00.000Z",
        updatedAt: "2026-02-15T14:05:00.000Z",
        authorId: "user-cohort-004",
        academic: {
          subjectName: "Signals and Systems",
          subjectCode: "EEE 3107",
          teacherName: "Arafat Karim",
          teacherDesignation: "Lecturer, Department of EEE"
        },
        sections: {
          objective: "To determine the gain response of an RC low-pass filter and identify the cutoff frequency from measured data.",
          theory: "A first-order RC low-pass filter attenuates frequencies above its cutoff frequency according to H(jw)=1/(1+jwRC).",
          apparatus: "Function generator, oscilloscope, resistor, capacitor, breadboard.",
          procedure: "Apply a sinusoidal input, sweep frequency, measure output amplitude, and compute gain.",
          result: "Measured gain dropped near -3 dB at the predicted cutoff frequency and continued to decrease at higher frequencies.",
          conclusion: "Observed response matched theoretical first-order filter behavior and confirmed expected attenuation characteristics.",
          references: "Signals and Systems practical handbook."
        },
        dataTable: {
          headers: ["Frequency", "Vin", "Vout", "Gain"],
          rows: [
            ["100 Hz", "2.0 V", "1.98 V", "-0.09 dB"],
            ["1 kHz", "2.0 V", "1.42 V", "-3.0 dB"],
            ["5 kHz", "2.0 V", "0.39 V", "-14.2 dB"]
          ]
        }
      }),
      createReport({
        id: "report-transformer-draft",
        title: "Transformer Open and Short Circuit Test",
        categoryId: "power",
        status: "draft",
        summary: "Draft analysis of no-load and short-circuit testing used to estimate transformer equivalent parameters.",
        experimentNo: "EXP-02",
        experimentDate: "2026-03-18",
        createdAt: "2026-03-18T10:00:00.000Z",
        updatedAt: "2026-03-22T16:45:00.000Z",
        authorId: "user-cohort-005",
        academic: {
          subjectName: "Power Systems",
          subjectCode: "EEE 3205",
          teacherName: "Syed Abrar Hossain",
          teacherDesignation: "Professor, Department of EEE"
        },
        sections: {
          objective: "To determine transformer equivalent circuit parameters using open-circuit and short-circuit tests.",
          theory: "Open-circuit test estimates core loss and shunt branch values, while short-circuit test estimates copper loss and series parameters.",
          apparatus: "Single-phase transformer, wattmeter, ammeter, voltmeter, supply source.",
          procedure: "Draft pending completion after final measurement entry.",
          result: "Draft measurements entered but still require verification and error analysis.",
          conclusion: "Pending final review and publication.",
          references: "Power Systems Lab, transformer testing chapter."
        },
        dataTable: {
          headers: ["Test", "Voltage", "Current", "Power"],
          rows: [
            ["Open Circuit", "220 V", "0.36 A", "38 W"],
            ["Short Circuit", "34 V", "2.80 A", "72 W"]
          ]
        }
      })
    ];
  }

  function collectAcademicProfiles(reports) {
    return reports.map((report, index) => ({
      id: "profile-" + (index + 1),
      subjectName: report.academic.subjectName,
      subjectCode: report.academic.subjectCode,
      teacherName: report.academic.teacherName,
      teacherDesignation: report.academic.teacherDesignation,
      lastUsedAt: report.updatedAt,
      usageCount: 1 + Math.max(0, reports.length - index),
      categoryId: report.categoryId
    }));
  }

  ns.sampleData = {
    collectAcademicProfiles,
    createCohortUsers,
    seedReports
  };
}(window));
