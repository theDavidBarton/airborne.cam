import React, { useState, useRef, useEffect } from "react";
import "./styles.css";

import makeStyles from "@material-ui/core/styles/makeStyles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import {
  TextField,
  Button,
  Paper,
  Container,
  FormControl,
  FormControlLabel,
  Checkbox,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Grid,
  
} from "@material-ui/core";

import Chart from "./Chart";
import AddIcon from "@material-ui/icons/Add";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";

import { Text, StyleSheet } from "react-native-web";
import { roomCalculation, gaussianDistribution } from "./calc";

import Switch from '@material-ui/core/Switch';
import Collapse from '@material-ui/core/Collapse';
import useScrollTrigger from '@material-ui/core/useScrollTrigger';

const useStyles = makeStyles((theme) => ({
  root: {
    "& .MuiTextField-root": {
      margin: theme.spacing(1),
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
    }
  },
  buttonContainer: {
    "& > *": {
      margin: theme.spacing(1)
    }
  },
  papermiddle: {
    padding: "20px",
    textAlign: "center"
    // color: theme.palette.text.secondary,
  },
  containertop: {
    height: "100%",
    paddingTop: "0px",
    paddingLeft: "20px",
    textAlign: "right",
    backgroundColor: "#f2f2f2"
  },
  containermiddle: {
    position: "relative",
  },
  containerbottom: {
    display:"flex",
    backgroundColor: "#f2f2f2",
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  boxbottom: {
    maxWidth:"700px",
    padding:"20px"
  },
  containerfooter: {
    display:"flex",
    padding: "20px",
    // width: "100%",
  }
}));

export default function App() {
  const [Ar, setAr] = useState(100);
  const [Hr, setHr] = useState(3);
  const [t_max, setStayTime] = useState(60);
  const [maskType, setMaskType] = useState(0);
  const [activityType, setActivityType] = useState(1);
  const [maskTypeSick, setMaskTypeSick] = useState(0);
  const [activityTypeSick, setActivityTypeSick] = useState(1);
  const [cutoffType, setcutoffType] = useState(2);
  const [verticalvType, setverticalvType] = useState(0);
  const [sACHType, setsACHType] = useState(1);
  // const [ACH, setACH] = useState(2);
  const [nInf, setNInf] = useState(0);
  const [nInfmin, setNInfmin] = useState(1);
  const [nPeople, setNPeople] = useState(20);
  const [EH, setEH] = useState(0);
  const [occupancyType, setOccupancyType] = useState(0);
  const [advancedMode, setAdvancedMode] = useState(false);

  // Time/duration variables
  const [custombreakDate, setCustomBreakTime] = useState("12:30");
  const [t_customBreak, setCustomBreakDuration] = useState(0);
  const [startDate, setStartTime] = useState("09:00");
  const [endDate, setEndTime] = useState("17:00");

  const classes = useStyles();


  // const ref = useRef(null);
  // const handleScroll = () => {
  //   if (ref.current) {
  //     setSticky(ref.current.getBoundingClientRect().top <= 0);
  //   }
  // };

  // Collapse swtich stuff
  const [checked, setChecked] = React.useState(true);
  const handleChange = () => {
    setChecked((prev) => !prev);
  };

  // This defines the collapse and sticky of the top
  const mobileBreakpoint = useMediaQuery("(max-width: 1024px)");

  const triggerScroll = useScrollTrigger({
    disableHysteresis: true,
    threshold: 500,
  });
  
  const stickyCollapse= () => {
    const value = mobileBreakpoint * triggerScroll ? false : true; //replace checked with variable for scroll
    return value;
  };

  // Advanced mode button
  const handleAdvancedMode = () => {
    setAdvancedMode(!advancedMode);
  };

  // Defines data to display in apex charts
  const chartData = (Vli = 8) => {
    const {
      C,
      R,
      XCO2,
      peopleOverTime,
      infectedPeopleOverTime,
      timeSeries,
      Vperson
    } = roomCalculation(
      Ar,
      Hr,
      sACHType,
      nInf,
      nInfmin,
      nPeople,
      EH,
      Vli,
      maskType,
      activityType,
      maskTypeSick,
      activityTypeSick,
      cutoffType,
      verticalvType,
      occupancyType,
      custombreakDate,
      t_customBreak,
      startDate,
      endDate
    );

    const riskData = timeSeries.map((time, i) => [time / 3600, R[i] * 100]);
    const concentrationData = timeSeries.map((time, i) => [time / 3600, C[i]]);
    const co2Data = timeSeries.map((time, i) => [time / 3600, XCO2[i]]);
    const peopleData = timeSeries.map((time, i) => [
      time / 60,
      peopleOverTime[i]
    ]);
    const infectedData = timeSeries.map((time, i) => [
      time / 60,
      infectedPeopleOverTime[i]
    ]);
    return {
      riskData,
      concentrationData,
      co2Data,
      peopleData,
      infectedData,
      Vperson
    };
  };

  const data = {
    Vl1: chartData(),
    Vl2: chartData(9),
    Vl3: chartData(10)
  };

  const occupationSeries = [
    {
      name: "susceptible",
      data: data.Vl1.peopleData
    },
    {
      name: "infectious",
      data: data.Vl1.infectedData
    }
  ];

  const riskSeries = [
    {
      name: "Vl=10^9",
      data: data.Vl2.riskData
    },
    {
      name: "Vl=10^8",
      data: data.Vl1.riskData
    },
    {
      name: "Vl=10^10 copies/ml",
      data: data.Vl3.riskData
    }
  ];

  const concentrationSeries = [
    {
      name: "Vl=10^9",
      data: data.Vl2.concentrationData
    },
    {
      name: "Vl=10^8",
      data: data.Vl1.concentrationData
    },
    {
      name: "Vl=10^10 copies/ml",
      data: data.Vl3.concentrationData
    }
  ];

  const concentrationSeriesBASIC = [
    {
      name: "Vl=10^9 copies/ml",
      data: data.Vl2.concentrationData
    }
  ];

  const riskSeriesBASIC = [
    {
      name: "Vl=10^9 copies/ml",
      data: data.Vl2.riskData
    }
  ];

  const CO2Series = [
    {
      name: "CO2",
      data: data.Vl1.co2Data
    }
  ];

  return (
    <div className="App">
      {/* Top Row */}
        <div className={stickyCollapse() ? "nonsticky" : "sticky"}>
        <div className="sticky-wrapper">
        <Grid container spacing={0}>
          {/* Airborne.cam */}
          <Grid item xs={12} md={6}>
            <Container className={classes.containertop}>
             <Collapse in={stickyCollapse()}>
                <div>
                  <h2>
                    Airborne.cam
                  </h2>
                <p className="Spacer">
                  This app helps users understand
                  how ventilation affects the
                  indoors transmission of the SARS-CoV-2 virus. It considers a
                  "mixing ventilation" strategy to estimate the risk of infection for a single
                  individual exposed to virus particles. For that, it is assumed that
                  hands are washed and that individuals are far apart from each other — i.e. no risk of short-range transmission by droplets/aerosol.
                </p>
                <div className={classes.buttonContainer}>
                  <Button
                    variant="contained"
                    color="default"
                    target="_blank"
                    href="https://doi.org/"
                  >
                    Learn More
                  </Button>
                  <Button
                    variant="contained"
                    color={advancedMode ? "secondary" : "default"}
                    onClick={handleAdvancedMode}
                  >
                    Advanced mode {advancedMode ? "ON" : ""}
                  </Button>
                </div>
              </div>
              </Collapse>
            </Container>
          </Grid>

          {/* Infection risk plot */}
          <Grid item xs={12} md={6}>
            <Container 
            className={classes.containertop}>
              <Chart
                title=""
                yAxisLabel="INDIVIDUAL RISK OF INFECTION (%)"
                xAxisLabel="time (h)"
                series={advancedMode ? riskSeries : riskSeriesBASIC}
              />
              {/* <FormControlLabel
                control={<Switch checked={checked} onChange={handleChange} />}
                label="Fulltop"
              /> */}
            </Container>
          </Grid>
        </Grid>
        </div>
        </div>

      {/* Mid Row */}
      <div className="sticky-wrapper">
      <div className={classes.containermiddle}>
        <Grid container spacing={2}>
          {/* Room Settings */}
          <Grid item xs={12} lg={3} sm={6}>
            <Paper className={classes.papermiddle}>
              <form className={classes.root} noValidate autoComplete="off">
                <h4>
                  Room
                  <Tooltip title="Set the floor area and ceiling height of the room.">
                    <HelpOutlineIcon
                      style={{ color: "gray" }}
                      fontSize="small"
                    />
                  </Tooltip>
                </h4>

                <div className={classes.root}>
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <FormControl>
                        <TextField
                          value={Ar}
                          onChange={(event) => setAr(event.target.value)}
                          label="Floor area (m^2)"
                        />
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl>
                        <TextField
                          value={Hr}
                          onChange={(event) => setHr(event.target.value)}
                          label="Ceiling height (m)"
                        />
                      </FormControl>
                    </Grid>
                  </Grid>
                </div>
                <h4 className="Spacer">
                  Period
                  <Tooltip
                    title="Set the period of analysis.                   
                     The start time must be the time which the room
                    is first open. In other words, the room must be empty for a long time before this time."
                  >
                    <HelpOutlineIcon
                      style={{ color: "gray" }}
                      fontSize="small"
                    />
                  </Tooltip>
                </h4>
                <div className={classes.root}>
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <FormControl>
                        <TextField
                          id="timeFrom"
                          label="from"
                          type="time"
                          defaultValue="09:00"
                          // value = {startDate}
                          onChange={(event) => setStartTime(event.target.value)}
                          InputLabelProps={{
                            shrink: true
                          }}
                          inputProps={{
                            step: 300 // 5 min
                          }}
                        />
                      </FormControl>
                    </Grid>

                    <Grid item xs={6}>
                      <FormControl>
                        <TextField
                          id="timeTo"
                          label="to"
                          type="time"
                          defaultValue="17:00"
                          // value = {endDate}
                          onChange={(event) => setEndTime(event.target.value)}
                          InputLabelProps={{
                            shrink: true
                          }}
                          inputProps={{
                            step: 300 // 5 min
                          }}
                        />
                      </FormControl>
                    </Grid>
                  </Grid>
                </div>
                <h4 className="Spacer">
                  Ventilation
                  <Tooltip
                    title="Set the ventilation conditions in air changes per hour according to the room.
                    Typical values are given for different indoors spaces (office buildings, hopsitals, etc.)
                    Authorities recommend ventilation rates in terms of number of occupants in the room,
                    being typically 5-10 litres/second/person for schools and offices, depending on the maximum
                    density of the room (person/area)."
                  >
                    <HelpOutlineIcon
                      style={{ color: "gray" }}
                      fontSize="small"
                    />
                  </Tooltip>
                </h4>

                <div className={classes.root}>
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <FormControl>
                        <InputLabel id="selectACH">
                          (ACH)
                        </InputLabel>
                        <Select
                          labelId="selectACH"
                          value={sACHType}
                          onChange={(event) => setsACHType(event.target.value)}
                          InputLabelProps={{
                            shrink: true,
                            fullWidth: true
                          }}
                        >
                          <MenuItem value={0}>0.3 poorly ventilated</MenuItem>
                          <MenuItem value={1}>1 domestic </MenuItem>
                          <MenuItem value={2}>3 buildings</MenuItem>
                          <MenuItem value={3}>5 hospital ward</MenuItem>
                          <MenuItem value={4}>10 hospital ICU</MenuItem>
                          <MenuItem value={5}>25 hospital OT</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl>
                        <TextField
                          readOnly
                          value={data.Vl1.Vperson}
                          label="(l/s/person)"
                        />
                      </FormControl>
                    </Grid>
                  </Grid>
                </div>
                {advancedMode ? (
                  <>
                    <div className={classes.root}>
                      <Grid container spacing={3}>
                        <Grid item xs={6}>
                          <FormControl>
                            <InputLabel id="cutoff">
                              Aerosol cut-off size
                            </InputLabel>
                            <Select
                              labelId="cutoff"
                              value={cutoffType}
                              onChange={(event) =>
                                setcutoffType(event.target.value)
                              }
                            >
                              <MenuItem value={0}>5 μm</MenuItem>
                              <MenuItem value={1}>10 μm</MenuItem>
                              <MenuItem value={2}>20 μm</MenuItem>
                              <MenuItem value={3}>40 μm</MenuItem>
                              <MenuItem value={4}>100 μm</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={6}>
                          <FormControl>
                            <InputLabel id="vvel">
                              Air vertical velocity
                            </InputLabel>
                            <Select
                              labelId="vvel"
                              value={verticalvType}
                              onChange={(event) =>
                                setverticalvType(event.target.value)
                              }
                            >
                              <MenuItem value={0}>negligible ~0 m/s</MenuItem>
                              <MenuItem value={1}>low ~0.1 m/s</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </div>
                  </>
                ) : (
                  ""
                )}
                <div className="CWidth"></div>
              </form>
            </Paper>
          </Grid>

          {/* Occupancy */}
          <Grid item xs={12} lg={3} sm={6}>
            <Paper className={classes.papermiddle}>
              <form className={classes.root} noValidate autoComplete="off">
                <h4>
                  Occupancy
                  <Tooltip
                    title="Set the maximum number of occupants in the room and if they
                    are wearing a mask. Advanced mode allows for a room with
                    varying occupancy."
                  >
                    <HelpOutlineIcon
                      style={{ color: "gray" }}
                      fontSize="small"
                    />
                  </Tooltip>
                </h4>
                <div className={classes.root}>
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <FormControl>
                        <TextField
                          value={nPeople}
                          onChange={(event) => setNPeople(event.target.value)}
                          label="Max occupancy (#)"
                        />
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl>
                        <InputLabel id="mask">Mask type</InputLabel>
                        <Select
                          labelId="mask"
                          value={maskType}
                          onChange={(event) => setMaskType(event.target.value)}
                        >
                          <MenuItem value={0}>no mask</MenuItem>
                          <MenuItem value={1}>N95</MenuItem>
                          <MenuItem value={2}>surgical</MenuItem>
                          <MenuItem value={3}>3-ply cloth</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </div>
                <div>
                  <FormControl>
                    <InputLabel id="activity">Activity</InputLabel>
                    <Select
                      labelId="activity"
                      value={activityType}
                      onChange={(event) => setActivityType(event.target.value)}
                    >
                      {/*<MenuItem value={0}>sitting breathing</MenuItem>
                          <MenuItem value={1}>standing speaking</MenuItem>
                          <MenuItem value={2}>speaking loudly</MenuItem>
                          <MenuItem value={3}>heavy activity</MenuItem>
                          */}
                      <MenuItem value={0}>sitting/breathing</MenuItem>
                      <MenuItem value={1}>standing/light exercise</MenuItem>
                      <MenuItem value={2}>heavy exercise</MenuItem>
                    </Select>
                  </FormControl>
                </div>
                {advancedMode ? (
                  <>
                    <FormControl>
                      <InputLabel id="occupancyType">Occupancy type</InputLabel>
                      <Select
                        labelId="occupancyType"
                        value={occupancyType}
                        onChange={(event) =>
                          setOccupancyType(event.target.value)
                        }
                      >
                        <MenuItem value={0}>constant</MenuItem>
                        <MenuItem value={1}>gaussian</MenuItem>
                      </Select>
                    </FormControl>
                  </>
                ) : (
                  ""
                )}
              </form>
              {advancedMode ? (
                <div className="CWidth">
                  <Chart
                    series={occupationSeries}
                    title=""
                    yAxisLabel="people in the room (#)"
                    xAxisLabel="time (h)"
                    opposite="true"
                  />
                </div>
              ) : (
                ""
              )}
            </Paper>
          </Grid>

          {/* CO2 Break */}
          <Grid item xs={12} lg={3} sm={6}>
            <Paper className={classes.papermiddle}>
              <form className={classes.root} noValidate autoComplete="off">
                <h4>
                  Custom break
                  <Tooltip
                    title="To keep risk low, empty-room breaks can be taken throughout
                  the day where all occupants leave the room. This way, ventilation systems
                  can clean the air while there are no infectious individuals in the room.
                  For that, set the time and duration of a break. The 
                  advanced mode shows the CO2 concentration and allows for a
                  uniform-break, timetabling system."
                  >
                    <HelpOutlineIcon
                      style={{ color: "gray" }}
                      fontSize="small"
                    />
                  </Tooltip>
                </h4>
                <div className={classes.root}>
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <FormControl>
                        <TextField
                          id="time"
                          label="Start"
                          type="time"
                          defaultValue="12:30"
                          onChange={(event) =>
                            setCustomBreakTime(event.target.value)
                          }
                          InputLabelProps={{
                            shrink: true
                          }}
                          inputProps={{
                            step: 300 // 5 min
                          }}
                        />
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl>
                        <TextField
                          value={t_customBreak}
                          onChange={(event) =>
                            setCustomBreakDuration(event.target.value)
                          }
                          label="Duration (min)"
                        />
                      </FormControl>
                    </Grid>
                  </Grid>
                </div>
                {advancedMode ? (
                  <>
                    <h4>Regular breaks</h4>
                    <FormControl>
                      <TextField
                        value={EH}
                        onChange={(event) => setEH(event.target.value)}
                        label="Uniform breaks (#/h)"
                      />
                    </FormControl>
                  </>
                ) : (
                  ""
                )}
              </form>
              <h4>
                CO2 concentration
                <Tooltip
                  title=" CO2 concentration can be used (and measured!) to keep risk
                      low. Modern ventilation systems may monitor CO2 levels to control the
                      amount of outside air into the room. Levels below 1000 ppm
                      are indicative of adequate ventilation for indoor environments attended by a similar
                      group of people (e.g. offices, schools). Higher
                      ventilation rates may be needed for more intense
                      activities other than desk-based work."
                >
                  <HelpOutlineIcon style={{ color: "gray" }} fontSize="small" />
                </Tooltip>
              </h4>
              <div className="CWidth">
                <Chart
                  series={CO2Series}
                  title=""
                  yAxisLabel="CO2 (ppm)"
                  xAxisLabel="time (h)"
                  offsetX= "-100px"
                />
              </div>
            </Paper>
          </Grid>

          {/* Virus */}
          <Grid item xs={12} lg={3} sm={6}>
            <Paper className={classes.papermiddle}>
              <form className={classes.root} noValidate autoComplete="off">
                <h4>
                  Infectious individuals
                  <Tooltip
                    title="Set the constant number of infectious individuals in the room. If a relative
                     number of infectious people (%) is also set, the constant value is used as a minimum value.
                     The relative infectious people is useful in the advanced mode, where a varying occupancy can
                     be set. Also, the dvanced mode allows for assessing risk for two additional viral loads
                     in the saliva."
                  >
                    <HelpOutlineIcon
                      style={{ color: "gray" }}
                      fontSize="small"
                    />
                  </Tooltip>
                </h4>
                <div className={classes.root}>
                  <Grid container spacing={3}>
                  <Grid item xs={6}>
                      <FormControl>
                        <TextField
                          value={nInfmin}
                          onChange={(event) => setNInfmin(event.target.value)}
                          label="Constant infectious (#)"
                        />
                      </FormControl>
                    </Grid>

                    <Grid item xs={6}>
                      <FormControl>
                        <TextField
                          value={nInf}
                          onChange={(event) => setNInf(event.target.value)}
                          label="Percent infectious (%)"
                        />
                      </FormControl>
                    </Grid>
  
                    <Grid item xs={12}>
                      <FormControl>
                        <InputLabel id="maskSick">Mask type</InputLabel>
                        <Select
                          labelId="maskSick"
                          value={maskTypeSick}
                          onChange={(event) =>
                            setMaskTypeSick(event.target.value)
                          }
                        >
                          <MenuItem value={0}>no mask</MenuItem>
                          <MenuItem value={1}>N95</MenuItem>
                          <MenuItem value={2}>surgical</MenuItem>
                          <MenuItem value={3}>3-ply cloth</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl>
                        <InputLabel id="activity">Activity</InputLabel>
                        <Select
                          labelId="activity"
                          value={activityTypeSick}
                          onChange={(event) =>
                            setActivityTypeSick(event.target.value)
                          }
                        >
                          <MenuItem value={0}>sitting speaking</MenuItem>
                          <MenuItem value={1}>standing/exercise</MenuItem>
                          <MenuItem value={2}>heavy exercise</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </div>
              </form>

              <div className="CWidth">
                <Chart
                  series={
                    advancedMode
                      ? concentrationSeries
                      : concentrationSeriesBASIC
                  }
                  title=""
                  yAxisLabel="virus concentration in the air (PFU/m^3)"
                  xAxisLabel="time (h)"
                />
              </div>
              <div>
                {advancedMode ? (
                  <>
                    <Tooltip
                      title="Viral load is the concentration of virus in the saliva of
                        infected individuals, both symptomatic and asymptomatic. This value varies significantly over the
                        duration of the disease. The default value used (10^9 copies/ml) concerns that of sick individuals 
                        in the room are at their most infectious phase."
                    >
                      <HelpOutlineIcon
                        style={{ color: "gray" }}
                        fontSize="small"
                      />
                    </Tooltip>
                  </>
                ) : (
                  ""
                )}
              </div>
            </Paper>
          </Grid>
        </Grid>
      </div>

      {/* Footer Rows */}
      <div className={classes.containerbottom}>
       <Box className={classes.boxbottom}>
              <p className="Spacer">
                In an effort to keep this app relevant to address the COVID-19
                pandemic, the calculation method will be constantly updated to
                keep up with the latest scientific findings. To know more,
                please regularly check{" "}
                <a href="https://doi.org/">this document</a>. If you would like
                to collaborate with us, do get in touch!
              </p>
              <div className="Spacer">
                <div className={classes.buttonContainer}>
                  <Button
                    variant="contained"
                    color="default"
                    target="_blank"
                    href="mailto:contact@airborne.cam"
                  >
                    {" "}
                    Contact us{" "}
                  </Button>
                </div>
              </div>
            </Box>
            </div>
              
        <div className={classes.containerfooter}>
        <Grid container spacing={0}>
          <Grid item xs={12} sm={3}>
            <h3>Airborne.cam</h3>
          </Grid>
          <Grid item xs={12} sm={3}>
            <a className="FooterLink" href="">
              About us
            </a>
            <a className="FooterLink" href="https://doi.org/">
              Scientific basis
            </a>
          </Grid>
          <Grid item xs={12} sm={3}>
            <a className="FooterLink" href="https://github.org/">
              Source code
            </a>
          </Grid>
          <Grid item xs={12} sm={3}>
            <a className="FooterLink" href="https://arxiv.org/abs/2009.12781v2">
                Royal Society's RAMP guide
              
            </a>
            <a className="FooterLink" href="https://aerosol-soc.com/covid-19">
              UK Aerosol Society COVID-19
            </a>
          </Grid>
        </Grid>
      </div>
    </div>
  </div>
  );
}
