# DEXTRA
> **Control Without Contact** · Gesture-Driven Computing, Reimagined

A proof-of-concept project proposal for a webcam-based, gesture-driven pointing device replacement. DEXTRA is designed to let users perform cursor movement, clicking, dragging, scrolling, and command execution through hand gestures and optional voice commands — all from a standard laptop webcam, with no specialised hardware.

## What this project is

DEXTRA is a modular software solution that uses standard computer vision and hand-tracking technology to translate natural hand movements into desktop interaction. It targets touchless control scenarios, accessibility use cases, and environments where a conventional mouse is impractical.

## Key capabilities

- Real-time hand detection from a webcam feed
- Cursor movement driven by finger pose and hand position
- Click, double-click, drag, right-click, and scroll gestures
- Voice command support for common system actions
- User-adjustable behavior through configuration settings
- Custom gesture training for personalised shortcuts

## Feasibility and viability

Yes — DEXTRA is both logically developable and deployable. The core idea relies on available, proven technologies and avoids any need for specialised hardware.

### Why it is viable

- Webcam-based hand tracking is a mature capability supported by existing libraries and models.
- Mapping hand pose data to mouse events is a straightforward control problem with well-known solutions.
- The proposal already defines a modular architecture, which simplifies development, testing, and maintenance.
- DEXTRA is intended for Windows as a first platform, which is the most practical deployment target for desktop input-control tooling.

### Why it is deployable

- All necessary sensors are already present on most laptops and desktops (webcam, microphone).
- The deployment path is clear: package DEXTRA as a desktop utility and provide configuration via a browser-based settings interface (React + FastAPI).
- The project does not depend on exotic hardware or proprietary services, so it can be deployed in restricted and offline scenarios.

## Development guidance

The proposal outlines a phased implementation plan with focused milestones:

1. Foundation: capture webcam input, detect hands, and map a primary gesture to cursor motion.
2. Core gestures: add click, double-click, right-click, drag, and scroll behavior.
3. Voice commands: support speech-driven shortcuts and navigation.
4. Settings panel: let users tune thresholds, smoothing, and feature toggles.
5. Gesture trainer: allow custom gestures to be recorded and reused.
6. Testing and polish: stabilize behavior across lighting, background, and user variation.

By following that roadmap, the project can be built incrementally while validating feasibility at each stage.

## What to expect in this workspace

- `PROPOSAL.txt`: the complete project proposal and concept description.
- `README.md`: this high-level summary and assessment.
- `DEPLOYMENT_ASSESSMENT.md`: detailed analysis of deployment readiness, risks, and next steps.

## Conclusion

This proposal is grounded in a plausible and practical design. DEXTRA is both developable and deployable in a meaningful way, especially for the stated Windows-first target and accessibility/touchless-interaction use cases.
