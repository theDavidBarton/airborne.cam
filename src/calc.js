import moment from "moment";

// There's a bug here. If people=0, it will return infected=infmin. That's not the case in a custom break. It must return infected=0 //
const infectedPeople = (people, percent, infmin) => {
  const percentPeople = people * (percent / 100);
  const infected = infmin > percentPeople ? infmin : percentPeople;
  return infected;
};

const gaussianDistribution = (nPeople = 10, t_max = 60, t = 0) => {
  const a = nPeople;
  const b = t_max / 2;
  const c = t_max / 6;

  return a * Math.pow(Math.E, -Math.pow(t - b, 2) / Math.pow(2 * c, 2));
};

const roomCalculation = (
  Ar = 100,
  Hr = 3,
  sACHType = 1,
  infPercent = 1,
  inf_min = 1,
  n_people = 10,
  EH = 0,
  Vli = 8,
  maskType = 0,
  activityType = 0,
  maskTypeSick = 0,
  activityTypeSick = 0,
  cutoffType = 0,
  verticalvType = 0,
  occupancyType = 0,
  customBreakDate = "12:30",
  t_customBreak = 60,
  startDate = "09:00",
  endDate = "17:00"
) => {
  //% RiskVent: Solving for the unsteady concentration of PFU (or particles) in a well-mixed room

  // The equation for the concentration of virulent particles (in PFU), C(t), is:
  // C(t) = n_inf*N_r/(V*L) + (C(t0)-n_inf*N_r/(V*L))*exp(-L*(t-t0))

  // where t0 the starting time, n_inf the number of infected people, N_r the
  // emission rate of particles, V the room volume and L the total loss rate
  // which is the sum of viral decay, ventilation rate and gravitational settling.

  // L = 1/Tres + k + lambda where Tres = 1/ACH

  // The risk is evaluated by a simple exponential relationship
  // R = 1 - exp(-Ntotal/constant) where Ntotal the total number of particles
  // inhaled.

  // Equivalently, the concentration of CO2 (in ppm), XCO2(t), is:
  // XCO2(t) = background_CO2 + n_people*Q_CO2/(V*L) + (XCO2(t0)-n_people*Q_CO2/(V*L)-background_CO2)*exp(-L*(t-t0))

  // where background_CO2 the global ~415 ppm CO2 concentration outdoors

  // Clock (has to be increasing!)
  //   start,  end,    empty/filled

  // Convert Time start - end to duration

  const t_max =
    60 *
    moment(`2000-01-01 ${endDate}`).diff(
      moment(`2000-01-01 ${startDate}`),
      "hours",
      true
    );

  // ******************************************************
  // Code starts here
  // ******************************************************

  const breakWhen =
    3600 *
    moment(`2000-01-01 ${customBreakDate}`).diff(
      moment(`2000-01-01 ${startDate}`),
      "hours",
      true
    );

  // People over time
  const peopleInst = (t_max, t) => {
    const people =
      occupancyType === 0 ? n_people : gaussianDistribution(n_people, t_max, t);
    const infected = infectedPeople(people, infPercent, inf_min);
    const hasBreak =
      t >= breakWhen && t < breakWhen + 60 * t_customBreak ? 0.0 : 1.0;
    return {
      people: people * hasBreak,
      infected: infected * hasBreak
    };
  };

  // Sets ACH based on the modes set at the interface
  const sACH = [0.3, 1, 3, 5, 10, 25];
  let ACH = sACH[sACHType];

  // Decay rates
  const kappa_base = [ // gravitational settling rate , 1/h, (for each cut-off diameter and vertical velocity)
    0.39,
    0.39,
    0.39,
    0.39,
    0.39,
    0,
    0,
    0,
    0,
    0,
  ];
  let kappa = kappa_base[cutoffType + 5 * verticalvType]; // ... set gravitational settling rate, 1/h
  let lambda = 0.636; // ... viral decay rate, 1/h

  // Define background CO2 (hope this does not change a lot...)
  const co2_background = 415; // ... CO2 outdoors, ppm

  // Base value for CO2 emission (based on https://doi.org/10.1111/ina.12383)
  //const H_forCO2 = 1.8; // height of individual, m
  //const W_forCO2 = 80; // weight of individual, kg
  //const AD_forCO2 = 0.202*Math.pow(H_forCO2,0.725)*Math.pow(W_forCO2,0.425); // DuBois surface area, m^2
  const AD_forCO2 = 1.8; // averaged size adult, DuBois surface area, m^2
  const RQ_forCO2 = 0.85; // respiratory quotient (dimensionless)
  const co2_exhRate_without_met =
    (0.00276 * AD_forCO2 * RQ_forCO2) / (0.23 * RQ_forCO2 + 0.77); // ltr/s/met
  const met_ref = 1.15; // reference metabolic rate, met
  const co2_exhRate_ref = co2_exhRate_without_met * met_ref; // ... indicative CO2 emission rate, ltr/s

  // Metabolic rate applied to to co2_exhRate_ref (based on https://doi.org/10.1111/ina.12383).
  // (i) sitting/breathing, (ii) standing/light exercise, (iii) heavy exercise
  // in the paper these are taken for:
  // (i) average from range in sitting quietly 1.15 met (see met_ref above)
  // (ii) standing quietly,  light exercise  1.3 met
  // (iii) calisthenics, moderate effort 3.8 met
  const metabolic_rate_forCO2 = [met_ref, 1.3, 3.8]; //  metabolic rate based on activity, met

  // Base value for inhalation rate
  const inhRate_pure = 0.521; // ... inhalation rate, ltr/s,

  // Activity multiplier applied to inhRate_pure
  // (i) sitting breathing, (ii) standing speaking, (iii) speaking loudly, (iv) heavy activity
  // from Buonanno et al 2020 (https://doi.org/10.1016/j.envint.2020.106112)
  // IR = 0.54 m3/h : sedentary activity
  // IR = 1.38 m3/h : <light exercise, unmodulated vocalization> or <light exercise, voiced counting>
  // IR = 3.3 m3/h : <heavy exercise, oral breathing>
  // in Activity_type_inh we I take ratios of IR but we keep the inhRate_pure the same as a reference
  const Activity_type_inh = [1, 2.5556, 6.1111]; // multiplier for inhalation rate based on activity.

  // Base value for exhalation rate
  const exhRate_pure = 0.211; // ... exhlation rate for speaking from (Gupta et al., 2010), ltr/s

  // Activity multiplier applied to Ngen based on similar analysis with inhalation
  const Activity_type_Ngen = [1, 2.5556, 6.1111]; // multiplier for exhalation rate based on activity.

  // Multiplier based on mask efficiency
  const Mask_type = [0, 0.99, 0.59, 0.51]; // No mask, N95, Surgical, 3-ply Cloth from https://www.medrxiv.org/content/10.1101/2020.10.05.20207241v1

  // Conversions with applications of mask and activity to inhalation rate and CO2 emission
  // *** the exhalation equivalent for the virus is being accounted for in N_r
  let inhRate =
    inhRate_pure * (1 - Mask_type[maskType]) * Activity_type_inh[activityType]; // ... actual inhlation rate, ltr/s
  let co2_exhRate =
    (co2_exhRate_ref * metabolic_rate_forCO2[activityType]) / met_ref; // ... actual CO2 emission rate, ltr/s

  // Here we need an "effective" N_gen for aerosol particles
  // Ngen = [0.4527, 0.4843, 0.5890, 5.1152, 16.2196] // Ngen no vertical velocity
  // Ngen = [0.4728, 0.5058, 0.6470, 8.6996, 30.0730] // Ngen 0.1 m/s vertical velocity
  const Ngen_base = [
    0.4527,
    0.4843,
    0.589,
    5.1152,
    16.2196,
    0.4728,
    0.5058,
    0.647,
    8.6996,
    30.073
  ];
  // Find actual emission
  const base_N_r =
    (Activity_type_Ngen[activityTypeSick] *
      Ngen_base[cutoffType + 5 * verticalvType]) /
    Math.pow(10, 9);
  const Vl = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // viral load exponent, copies/ml
  const N_r = Math.pow(10, Vl[Vli]) * base_N_r * (1 - Mask_type[maskTypeSick]); // ... effective aerosol emission rate, PFU/s

  // Risk is p(N_vs) = 1-exp(-N_vs/riskConst);
  let riskConst = 4.1e2; // ... constant for risk estimation, PFU

  // Additional variables
  const V = Ar * Hr; // ... room volume, m^3
  const Vperson = Math.round((ACH / 3600) * (V * 1000) * (1 / n_people)); // ... ventilation rate, l/s/person

  // Conversions
  kappa = kappa / 3600; // ... 1/s
  lambda = lambda / 3600; // ... 1/s
  inhRate = inhRate / 1000; // ... m3/s
  const Tres = (1 / ACH) * 3600; // ... s
  const loss_rate = 1 / Tres + kappa + lambda;
  const loss_rate_co2 = 1 / Tres;
  co2_exhRate = co2_exhRate / 1000; // ,,, m3/s
  co2_exhRate = co2_exhRate * Math.pow(10, 6); // ...scale to calculate ppm in the end

  // Find minimum and maximum time for each event in seconds
  let t0 = 0;
  let tMax = t_max * 60;

  // Solver settings
  const dt = 0.5 * 60; // ... time increment, s

  // Initialisation
  let R = []; // ... Risk over time
  let C = []; // ... concentration vector, PFU/m3
  let Ninh = []; // ... inhaled virus vector, PFU
  let XCO2 = []; // ... CO2 mole fraction vector, ppm
  let peopleOverTime = []; // ... total number of people within room, #
  let infectedPeopleOverTime = []; // ... total number of people within room, #

  let timeSeries = [];

  // Custom subroutines
  const createVector = (a1, an, increment = 1) => {
    const vec = [];
    for (let i = a1; i <= an; i += increment) {
      vec.push(i);
    }
    return vec;
  };

  // New Solver =========================

  timeSeries = createVector(t0, tMax, dt);
  const nBreaks = EH * 2;

  const breakLength = timeSeries.length / nBreaks;
  let p = true;
  let acc = 0;
  const breakVector = timeSeries.map(() => {
    if (breakLength < acc) {
      p = !p;
      acc = 0;
    }
    acc++;
    return p;
  });

  peopleOverTime = timeSeries.map(
    (t, i) => breakVector[i] * peopleInst(tMax, t).people
  );
  infectedPeopleOverTime = timeSeries.map(
    (t, i) => breakVector[i] * peopleInst(tMax, t).infected
  );

  for (let i = 0; i < timeSeries.length; i++) {
    const t = timeSeries[i];
    const hasPeople = peopleOverTime[i] > 0;

    // Virus concentration
    C[i] =
      (hasPeople * peopleInst(tMax, t).infected * N_r) / V / loss_rate +
      ((C[i - 1] || 0) -
        (hasPeople * peopleInst(tMax, t).infected * N_r) / V / loss_rate) *
        Math.exp(-loss_rate * dt);

    // CO2 Concentration
    XCO2[i] =
      co2_background +
      (hasPeople * peopleInst(tMax, t).people * co2_exhRate) /
        V /
        loss_rate_co2 +
      ((XCO2[i - 1] || co2_background) -
        (hasPeople * peopleInst(tMax, t).people * co2_exhRate) /
          V /
          loss_rate_co2 -
        co2_background) *
        Math.exp(-loss_rate_co2 * dt);

    Ninh[i] = (Ninh[i - 1] || 0) + hasPeople * inhRate * dt * C[i];
    R[i] = 1 - Math.exp(-Ninh[i] / riskConst);
  }

  // Final result
  return {
    C,
    R,
    XCO2,
    peopleOverTime,
    infectedPeopleOverTime,
    timeSeries,
    Vperson
  };
};

export { roomCalculation, gaussianDistribution };
