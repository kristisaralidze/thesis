import React from "react";
import { FaEye } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./ProjectCard.css";

const ProjectCard = ({ project }) => {
  // 1. Calculate progress from deliverables
  const totalDeliverables = project.deliverables?.length || 0;
  // Example: each deliverable has "status" = "Completed" or something similar
  const completedDeliverables = project.deliverables?.filter(
    (d) => d.status === "Completed"
  ).length || 0;
  
  const progressPercent =
    totalDeliverables === 0
      ? 0
      : Math.round((completedDeliverables / totalDeliverables) * 100);

  // 2. Format the due date
  let dueDateText = "No Due Date";
  if (project.end_date) {
    const dateObj = new Date(project.end_date);
    dueDateText = dateObj.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  // 3. Determine the status
  // Fallback to "Not Started" if none is set
  const status = project.status || "Not Started";

  return (
    <div className="project-card">
      {/* Status badge in the top-right corner */}
      <div className={`status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}`}>
        {status.toUpperCase()}
      </div>

      {/* Project Title */}
      <h3 className="project-title">
        {project.name?.toUpperCase() || "PROJECT NAME"}
      </h3>

      {/* (Optional) Short Description */}
      {project.description && (
        <p className="project-description">
          {project.description}
        </p>
      )}

      {/* Progress Bar (only if there's at least 1 deliverable) */}
      {totalDeliverables > 0 && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Progress & Due Date Info */}
      <div className="progress-info">
        <span>{progressPercent}% COMPLETED</span>
        <span>DUE: {dueDateText}</span>
      </div>

      {/* View Project Button */}
      <Link to={`/projects/${project._id}`} className="view-btn">
        <FaEye className="eye-icon" />
        <span>VIEW</span>
      </Link>
    </div>
  );
};

export default ProjectCard;




// import React from "react";
// import { FaEye } from "react-icons/fa"; // or another icon library
// import { Link } from "react-router-dom";
// import "./ProjectCard.css";

// const ProjectCard = ({ project }) => {
//   // Example logic to calculate progress
//   // Adjust as needed for your actual data structure
//   const totalDeliverables = project.deliverables?.length || 0;
//   const completedDeliverables = project.deliverables?.filter(d => d.completed)?.length || 0;
//   const progressPercent = totalDeliverables === 0
//     ? 0
//     : Math.round((completedDeliverables / totalDeliverables) * 100);

//   // Format the date if needed
//   const dueDate = new Date(project.end_date).toLocaleDateString(undefined, {
//     month: "long",
//     day: "numeric",
//     year: "numeric",
//   });

//   return (
//     <div className="project-card">
//       {/* Status pill in top-right corner */}
//       <div className="status-badge">
//         {project.status || "IN PROGRESS"}
//       </div>

//       {/* Title */}
//       <h3 className="project-title">
//         {project.name?.toUpperCase() || "PROJECT NAME"}
//       </h3>

//       {/* Progress Bar */}
//       <div className="progress-bar">
//         <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
//       </div>

//       {/* Progress details */}
//       <div className="progress-info">
//         <span>{progressPercent}% COMPLETED</span>
//         <span>DUE: {dueDate}</span>
//       </div>

//       {/* View Button */}
//       <Link to={`/projects/${project._id}`} className="view-btn">
//         <FaEye className="eye-icon" />
//         <span>VIEW</span>
//       </Link>
//     </div>
//   );
// };

// export default ProjectCard;
