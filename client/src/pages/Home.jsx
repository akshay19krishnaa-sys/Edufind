import { Link } from "react-router-dom";
import heroImage from "../assets/hero-learning.jpg";
import "../styles/Home.css";

const STEPS = [
  {
    title: "Discover Institutes",
    description:
      "Browse training institutes by course, location, and learning style to find options that fit your goals.",
  },
  {
    title: "Compare Courses and Fees",
    description:
      "Review programs side by side so you can weigh fees, duration, and opportunities with clarity.",
  },
  {
    title: "Apply or Enroll",
    description:
      "Move forward with the institute that matches you — whether online classes or on-campus training.",
  },
];

const BENEFITS = [
  {
    title: "Verified institute profiles",
    description:
      "Clear, structured profiles that help you evaluate training institutes with confidence.",
  },
  {
    title: "Course & fee comparisons",
    description:
      "Compare what matters most before you commit — courses, costs, and learning formats.",
  },
  {
    title: "Online learning options",
    description:
      "Find institutes offering flexible online courses and classes alongside in-person programs.",
  },
  {
    title: "Easier admissions",
    description:
      "A simpler path from discovery to enrollment for students exploring the right program.",
  },
];

function Home() {
  return (
    <div className="home-page">
      <section className="hero-section" aria-labelledby="hero-heading">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:gap-14 md:py-24 lg:gap-16 lg:py-28">
          <div className="hero-content">
            <p className="hero-eyebrow">Your learning journey starts here</p>
            <h1 id="hero-heading" className="hero-title">
              Find the Right Institute{" "}
              <span className="hero-title-accent">for Your Future</span>
            </h1>
            <p className="hero-description">
              EduFind helps students discover, compare, and choose training
              institutes based on courses, fees, location, and learning
              opportunities — all in one place.
            </p>

            <div className="hero-actions flex flex-wrap items-center gap-3 sm:gap-5">
              <Link to="/institutes" className="btn-primary">
                Explore Institutes
                <span aria-hidden="true">→</span>
              </Link>
              <Link to="/courses" className="btn-secondary">
                Explore Online Courses
              </Link>
            </div>

            <p className="hero-trust-line">
              Discover <span aria-hidden="true">•</span> Compare{" "}
              <span aria-hidden="true">•</span> Choose with Confidence
            </p>
          </div>

          <div className="hero-visual">
            <div className="hero-visual-frame">
              <img
                src={heroImage}
                alt="Students collaborating in a modern learning workspace"
                className="hero-image"
                width={900}
                height={1100}
              />
            </div>

            <div
              className="hero-float-card hero-float-card--top"
              aria-hidden="true"
            >
              <span className="hero-float-dot hero-float-dot--teal" />
              <div>
                <p className="hero-float-title">Compare Courses</p>
                <p className="hero-float-meta">Fees · Duration · Format</p>
              </div>
            </div>

            <div
              className="hero-float-card hero-float-card--bottom"
              aria-hidden="true"
            >
              <span className="hero-float-dot hero-float-dot--accent" />
              <div>
                <p className="hero-float-title">Find Your Best Fit</p>
                <p className="hero-float-meta">Location · Goals · Skills</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="how-it-works py-16 md:py-20"
        aria-labelledby="how-heading"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow">Simple process</p>
            <h2 id="how-heading" className="section-title">
              How EduFind Works
            </h2>
            <p className="section-description mx-auto">
              Three clear steps from discovery to enrollment.
            </p>
          </div>

          <div className="steps-row mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <article key={step.title} className="step-card">
                <span className="step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="benefits-section py-16 md:py-20"
        aria-labelledby="benefits-heading"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow">Why EduFind</p>
            <h2 id="benefits-heading" className="section-title">
              Built for clearer institute decisions
            </h2>
            <p className="section-description mx-auto">
              A focused platform for students exploring training institutes —
              not schools or colleges.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit) => (
              <article key={benefit.title} className="benefit-card">
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-cta py-16 md:py-20" aria-labelledby="cta-heading">
        <div className="home-cta-inner mx-auto max-w-3xl px-6 text-center">
          <h2 id="cta-heading">Ready to find your next program?</h2>
          <p>
            Explore institutes and online courses that match your goals — then
            compare options with confidence.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/institutes" className="btn-cta-accent">
              Explore Institutes
            </Link>
            <Link to="/courses" className="btn-cta-ghost">
              Explore Online Courses
            </Link>
          </div>
        </div>
      </section>

      <section
        className="institute-invite py-14 md:py-16"
        aria-labelledby="institute-invite-heading"
      >
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="section-eyebrow">For institute partners</p>
          <h2 id="institute-invite-heading" className="section-title">
            Are you an Institute?
          </h2>
          <p className="section-description mx-auto">
            Join EduFind to showcase your institute and connect with prospective
            students.
          </p>
          <div className="mt-7">
            <Link to="/institute/register" className="btn-institute-invite">
              Register Your Institute
            </Link>
          </div>
        </div>
      </section>

      <footer className="home-footer py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 sm:flex-row">
          <Link to="/" className="brand-mark m-0" aria-label="EduFind Home">
            <img
              src="/images/edufind-logo-clean.png"
              alt="EduFind"
              className="h-7 w-auto object-contain"
            />
          </Link>
          <p className="m-0">Discover · Compare · Choose with confidence</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
