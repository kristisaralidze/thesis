import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import "./Templates.css";

// Static array of templates
const TEMPLATES_DATA = [
  {
    id: "lean-canvas",
    name: "Lean Canvas",
    description: "A one-page business planning tool for startups/innovation.",
    route: "/templates/lean-canvas",
  },
  {
    id: "project-charter",
    name: "Project Charter",
    description: "Defines project objectives, scope, and stakeholders.",
    route: "/templates/project-charter",
  },
  {
    id: "stakeholder-register",
    name: "Stakeholder Register",
    description: "Identifies stakeholders and their influence/interest.",
    route: "/templates/stakeholder-register",
  },
  {
    id: "project-plan",
    name: "Project Plan",
    description: "Comprehensive plan for executing and controlling a project.",
    route: "/templates/project-plan",
  },
  {
    id: "work-breakdown-structure",
    name: "Work Breakdown Structure",
    description: "Hierarchical decomposition of project deliverables.",
    route: "/templates/work-breakdown-structure",
  },
  {
    id: "risk-register",
    name: "Risk Register",
    description: "Tracks potential risks and mitigation strategies.",
    route: "/templates/risk-register",
  },
  // {
  //   id: "issue-log",
  //   name: "Issue Log",
  //   description: "Records and monitors project issues requiring resolution.",
  //   route: "/templates/issue-log",
  // },
  // {
  //   id: "project-status-report",
  //   name: "Project Status Report",
  //   description: "Periodic update on project progress and performance.",
  //   route: "/templates/project-status-report",
  // },
  {
    id: "close-out-report",
    name: "Close Out Report",
    description: "Documents final outcomes and lessons learned upon project completion.",
    route: "/templates/close-out-report",
  },
  {
    id: "project-budget",
    name: "Project Budget",
    description: "Estimates and tracks all project financial expenditures.",
    route: "/templates/project-budget",
  },
];

const Templates = () => {
  return (
    <>
      <Navbar />
      <div className="templates-container">
        {/* Page Header */}
        <h1 className="page-title">Project Management Templates</h1>
        <p className="subtitle">
          Select and customize a standard template for your project. Once customized, it will be saved in your project's documentation.
        </p>

        {/* Templates Grid */}
        <div className="templates-grid">
          {TEMPLATES_DATA.map((template) => (
            <div className="template-card" key={template.id}>
              <h3 className="template-name">{template.name}</h3>
              <p className="template-description">{template.description}</p>
              <div className="template-actions">
                <Link to={template.route} className="view-btn">
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Templates;
