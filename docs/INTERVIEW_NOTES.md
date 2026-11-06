# OrbitGuard — Technical Interview Study Guide & Engineering Defense
**Author Specialization**: Electrical & Electronics Engineering (EEE) / Astrodynamics / Embedded Systems  
**Target Roles**: ISRO (Scientist/Engineer 'SC'), HAL (Design Trainee), Aerospace Software & Systems Engineering

---

## Non-Negotiable Engineering Ground Truths (Memorize These)
1. **Public TLEs have zero covariance matrices.** Any probability of collision ($P_c$) computed from public CelesTrak TLEs uses a *synthetic covariance model* and is strictly **screening-grade**, never operational. Real operational decisions at ISRO ISTRAC require radar tracking and Conjunction Data Messages (CDMs) from military surveillance or satellite owner-operators.
2. **SGP4 propagates in the TEME (True Equator, Mean Equinox) celestial inertial frame**, not ECEF. Earth rotates under the satellites by Greenwich Mean Sidereal Time (GMST).
3. **Doppler calculations must compensate for Earth's rotation tangential velocity $\mathbf{v}_{\text{obs}}$.** Neglecting $\mathbf{v}_{\text{obs}}$ introduces up to $\pm 465\text{ m/s}$ of line-of-sight velocity error at equatorial ground stations, causing hundreds of Hertz of Doppler error at UHF.

---

## Module 1: Orbit Propagation & Coordinate Reference Frames

### Technical Summary
- **Function**: Propagates 3,700+ to 25,000+ celestial objects forward in time directly inside a dedicated Web Worker thread.
- **Key Equation**: SGP4 perturbation model accounting for Earth oblateness ($J_2, J_3, J_4$) and atmospheric drag decay parameter $B^*$:
  $$\mathbf{r}_{\text{TEME}}(t), \; \mathbf{v}_{\text{TEME}}(t) = \text{SGP4}(t, \text{TLE})$$
  $$\mathbf{r}_{\text{ECEF}}(t) = \mathbf{R}_z(\text{GMST}) \cdot \mathbf{r}_{\text{TEME}}(t)$$
- **Main Assumption**: Neglects higher-order gravitational harmonics ($J_5+$), lunisolar three-body perturbations over short periods, and solar radiation pressure fluctuations.
- **Biggest Limitation**: TLE accuracy degrades rapidly over time (position errors grow by $1\text{ to }3\text{ km/day}$ for LEO).
- **Validation**: Verified against official Vallado AIAA 2006-6753 verification test dataset (`SGP4-VER.TLE`). Achieved agreement within $0.008\text{ mm}$ position and $0.001\text{ mm/s}$ velocity error across 113 orbital test cases.

### Top 3 Interview Questions & Model Answers
1. **Q: Why does OrbitGuard use the TEME reference frame rather than standard J2000 / ECI?**  
   *Answer*: The SGP4 analytical theory was formulated specifically in the True Equator, Mean Equinox of Date (TEME) frame to avoid complex nutation/precession calculations for high-speed tracking. To align with Earth's surface, we rotate the Earth mesh around its celestial axis by Greenwich Mean Sidereal Time (GMST): $\mathbf{R}_z(\theta_{\text{GMST}})$, keeping satellites in their native inertial propagation frame.
2. **Q: How did you scale SGP4 propagation to 25,000+ objects without locking the browser UI thread?**  
   *Answer*: By offloading the entire catalog to a Web Worker (`propagator.worker.ts`). The worker propagates satellites at a lower frequency (1–2 Hz) and passes the 3D coordinates and velocities to the main thread as zero-copy transferable `Float32Array` buffers (ping-pong double buffering). The GPU vertex shader extrapolates positions at 60 FPS using $\mathbf{r} = \mathbf{r}_0 + \mathbf{v} \cdot \Delta t$.
3. **Q: What is the physical significance of the $B^*$ drag term in a TLE?**  
   *Answer*: $B^* = \frac{1}{2} \frac{C_D A}{m} \rho_0$ in units of Earth radii inverse. It combines the spacecraft ballistic coefficient $\frac{m}{C_D A}$ with a reference atmospheric density $\rho_0$, absorbing unmodeled density variations over the fitting span.

---

## Module 2: Conjunction Assessment & Collision Probability ($P_c$)

### Technical Summary
- **Function**: Predicts close encounters between operational satellites and orbital debris within a 7-day screening window and calculates bivariate collision probability.
- **Key Equations**:
  - Foster-1992 2-D Encounter Plane Integral:
    $$P_c = \frac{1}{2\pi \sqrt{\det \mathbf{C}_{2D}}} \iint_{\text{Disk}(R_{\text{HBR}})} \exp\left(-\frac{1}{2}(\mathbf{r} - \mathbf{m})^T \mathbf{C}_{2D}^{-1} (\mathbf{r} - \mathbf{m})\right) d^2\mathbf{r}$$
    Integrated numerically via 64-point Gauss-Legendre quadrature in polar coordinates.
  - Akella-Alfriend Maximum Collision Probability ($P_{c,\text{max}}$):
    $$P_{c,\text{max}} = \max_{k > 0} P_c(\mathbf{m}, k \mathbf{C}_{2D})$$
- **Main Assumption**: Short encounter assumption (encounter duration $\ll$ orbital period), rectilinear relative motion at TCA, Gaussian error distribution, and constant covariance during the encounter.
- **Biggest Limitation**: Synthetic RTN covariance must be used because public element sets omit covariance data.
- **Validation**: 
  1. Analytic check: For zero miss vector ($\mathbf{m} = \mathbf{0}$) and isotropic covariance $\sigma^2 \mathbf{I}$, numerical $P_c$ agreed with $1 - \exp(-R^2 / 2\sigma^2)$ to within $10^{-7}$.
  2. Monte Carlo validation: Compared with 50,000 sampled Gaussian points.
  3. CelesTrak SOCRATES cross-validation engine.

### Top 3 Interview Questions & Model Answers
1. **Q: Explain the difference between miss distance and collision probability ($P_c$). Why can a smaller miss distance have a lower $P_c$?**  
   *Answer*: Miss distance is purely geometric, whereas $P_c$ integrates the probability density function over the combined hard-body radius. If position uncertainty $\sigma$ is extremely large, the probability density spreads over hundreds of kilometers, causing $P_c$ to approach zero despite a near-zero miss distance. This is why Akella-Alfriend $P_{c,\text{max}}$ is evaluated to find the worst-case covariance scale.
2. **Q: What is the Hard Body Radius (HBR) and how is it determined?**  
   *Answer*: HBR is the collision sphere radius enclosing both colliding objects: $R_{\text{HBR}} = R_1 + R_2$. For operational satellites, it is derived from physical solar array wingspan; for debris, it is estimated from radar cross-section (RCS) using NASA's Size Estimation Model.
3. **Q: When does the Foster-1992 2-D encounter plane assumption break down?**  
   *Answer*: When relative closing speed $v_{\text{rel}}$ is very low (e.g. co-orbital satellites or co-located GEO satellites where $v_{\text{rel}} < 10\text{ m/s}$). In that regime, relative motion is curved rather than linear, requiring 3-D curvilinear Monte Carlo or Chan's method.

---

## Module 3: RF Ground Station, Doppler & Topocentric Tracking

### Technical Summary
- **Function**: Predicts ground station look angles (Az/El), computes relativistic downlink Doppler shift and uplink pre-compensation, and tracks azimuth/elevation passes.
- **Key Equations**:
  - Topocentric Range Rate:
    $$\dot{\rho} = \frac{(\mathbf{r}_{\text{sat}} - \mathbf{r}_{\text{obs}}) \cdot (\mathbf{v}_{\text{sat}} - \mathbf{v}_{\text{obs}})}{\|\mathbf{r}_{\text{sat}} - \mathbf{r}_{\text{obs}}\|}$$
    where $\mathbf{v}_{\text{obs}} = [-\omega_E y_{\text{obs}}, \; \omega_E x_{\text{obs}}, \; 0]^T$.
  - Downlink Doppler Shift: $\Delta f = -f_0 \frac{\dot{\rho}}{c}$.
  - Central Difference Doppler Rate: $\frac{d(\Delta f)}{dt} \approx \frac{\Delta f(t + h) - \Delta f(t - h)}{2h}$.
- **Main Assumption**: Flat Earth approximation avoided (uses full WGS84 ellipsoidal geometry); relativistic terms $(v/c)^2 \approx 10^{-9}$ neglected.
- **Biggest Limitation**: Tropospheric radio refraction at very low elevations ($< 3^\circ$) introduces ray bending not modeled in geometric look angles.
- **Validation**: Verified against analytical circular orbit geometry and Python Skyfield ephemeris reference outputs.

### Top 3 Interview Questions & Model Answers
1. **Q: Why does the Doppler curve form an S-shape, and where is the maximum Doppler rate?**  
   *Answer*: As a satellite rises above the horizon, its line-of-sight velocity approaches the observer, producing a positive Doppler shift. As it passes overhead at TCA, line-of-sight velocity changes most rapidly from approaching to receding, crossing zero. The maximum slope (Doppler rate in Hz/s) occurs at TCA (closest approach), requiring the widest receiver tracking loop bandwidth.
2. **Q: What happens if an antenna rotator tracking a pass encounters a 90° zenith pass? How does OrbitGuard handle it?**  
   *Answer*: This is the **zenith keyhole singularity**. As elevation reaches 90°, azimuth changes by 180° almost instantaneously, requiring an infinite azimuth slew rate. OrbitGuard detects passes exceeding $85^\circ$ elevation and executes either:
   - *Flip-mode* (for 0–180° elevation rotators): elevates past 90° without rotating azimuth.
   - *Rate-clamp mode*: holds azimuth steady during the 60 seconds around zenith to avoid mechanical motor stalling.
3. **Q: How does uplink pre-compensation work, and why is it necessary?**  
   *Answer*: Because the satellite is in motion, if the ground station transmits at nominal frequency $f_0$, the satellite receiver will experience a shifted signal $f_0(1 - \dot{\rho}/c)$. For narrow transponder filters or high-data-rate uplinks, the ground station pre-shifts its transmit frequency: $f_{\text{tx}} = \frac{f_0}{1 - \dot{\rho}/c}$.

---

## Module 4: RF Link Budget & Antenna Gain

### Technical Summary
- **Function**: Evaluates dynamic Free-Space Path Loss (FSPL), received power ($P_{\text{rx}}$), carrier-to-noise density ($C/N_0$), energy-per-bit ($E_b/N_0$), and margin along the entire pass.
- **Key Equations**:
  $$\text{FSPL (dB)} = 20\log_{10}(d_{\text{km}}) + 20\log_{10}(f_{\text{MHz}}) + 32.44$$
  $$G_{\text{dBi}} = 10\log_{10}\left(\eta \left(\frac{\pi D f}{c}\right)^2\right)$$
  $$\frac{C}{N_0} = \text{EIRP} - \text{FSPL} - L_{\text{atm}} - L_{\text{point}} + \left(\frac{G}{T}\right) + 228.6$$
  $$\text{Margin} = \frac{C}{N_0} - 10\log_{10}(R_b) - \left(\frac{E_b}{N_0}\right)_{\text{req}} - L_{\text{impl}}$$
- **Main Assumption**: Atmospheric attenuation approximated using cosecant model $L_{\text{zenith}} / \sin(\text{el})$.
- **Biggest Limitation**: Does not incorporate rain fade statistics (ITU-R P.618) or ionospheric scintillation (important for VHF/UHF equatorial passes).
- **Validation**: Verified against hand-calculated textbook link budgets and verified $20\log_{10}$ scaling laws ($6.02\text{ dB}$ increase upon doubling distance or frequency).

### Top 3 Interview Questions & Model Answers
1. **Q: Walk me through closing an X-band payload downlink at 150 Mbps for an Earth observation satellite.**  
   *Answer*: At 8.2 GHz and 850 km slant range, FSPL is $\sim 169\text{ dB}$. With a 10W transmitter (+10 dBW) and 14 dBi satellite antenna, EIRP is +22.5 dBW. Using a 3.7m ground station dish ($G_r \approx 46\text{ dBi}$, $T_{\text{sys}} \approx 110\text{ K} \implies G/T \approx +25.6\text{ dB/K}$), the received $C/N_0$ is $\sim 104\text{ dB-Hz}$. For $R_b = 150\text{ Mbps}$ (81.8 dB-Hz), received $E_b/N_0 \approx 22.2\text{ dB}$, easily exceeding the $8.5\text{ dB}$ required for 8PSK Rate 3/4 with $> 11\text{ dB}$ of link margin.
2. **Q: What is the physical origin of the constant $+228.6$ in the $C/N_0$ link equation?**  
   *Answer*: It is $-10\log_{10}(k_B)$, where $k_B$ is Boltzmann's constant ($1.380649 \times 10^{-23}\text{ J/K} = \text{W/(Hz}\cdot\text{K)}$). Since noise power is $N_0 = k_B T$, in decibels: $N_0\text{ [dBW/Hz]} = 10\log_{10}(T) - 228.6$.
3. **Q: How does antenna pointing error impact link performance?**  
   *Answer*: Parabolic antenna beamwidth narrows inversely with frequency: $\text{HPBW} \approx 70 \frac{\lambda}{D}$. As frequency increases from UHF to X-band, beamwidth drops from $30^\circ$ down to $< 0.8^\circ$. Pointing loss follows $L_{\text{point}} \approx 12 (\theta_{\text{err}} / \text{HPBW})^2$. A small pointing error of $0.5^\circ$ produces negligible loss at UHF but can completely sever an X-band link ($> 5\text{ dB}$ degradation).

---

## Module 5: Antenna Rotator Control & Embedded Firmware Design

### Technical Summary
- **Function**: Drives steerable dual-axis antenna arrays over Web Serial API, local WebSocket bridge (`ws://127.0.0.1:8765`), or virtual simulator.
- **Supported Protocols**: Yaesu GS-232A/B (`W<AAA> <EEE>\r`), Easycomm I/II, and Hamlib `rotctld`.
- **Embedded Architecture**: ESP32 microcontroller running FreeRTOS with AccelStepper trapezoidal velocity profiling, TMC2209 silent stepper drivers, and AS5600 12-bit magnetic feedback.
- **Gear Kinematics**:
  $$\text{Steps per Degree} = \frac{200 \times 16 \times 60}{360} = 533.3333\text{ steps/deg}$$
- **Safety**: 15-second communications loss watchdog, mechanical limit switches, emergency stop, and software deadband hysteresis ($0.4^\circ$).

### Top 3 Interview Questions & Model Answers
1. **Q: Why use stepper motors with worm gearboxes instead of standard DC servo motors for an antenna rotator?**  
   *Answer*: Stepper motors provide exact step-count positioning without hunting. Worm gearboxes are self-locking (cannot be backdriven by outdoor wind loads on high-surface-area dish or Yagi antennas), preventing mast drift when unpowered.
2. **Q: How does OrbitGuard resolve azimuth cable wrap?**  
   *Answer*: For rotators supporting $450^\circ$ extended rotation, when tracking a satellite passing through North ($355^\circ \to 5^\circ$), commanding $5^\circ$ would cause a $350^\circ$ reverse slew, losing signal for over a minute. OrbitGuard evaluates the wrap boundary and commands $365^\circ$ instead, slewing smoothly across the meridian.
3. **Q: How do you prevent electromagnetic interference (EMI) from the stepper motor drivers from interfering with weak RF signals?**  
   *Answer*: TMC2209 drivers operate using high-frequency PWM ($20\text{–}40\text{ kHz}$). To protect sensitive low-noise amplifiers (LNAs), the controller enclosure uses shielded aluminum housing, star grounding connected to station earth, shielded twisted-pair motor leads, and Type 43 ferrite beads placed at the motor outputs.
