// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract postJob {
    // 1. Enums and Structs
    // Use an enum for clearer, safer status tracking
    enum ApplicationStatus {
        Pending, // 0
        Accepted, // 1
        Rejected // 2
    }

    struct jobPosting {
        string title;
        string description;
        string budget;
        string[] tools;
    }

    // 2. State Variables and Mappings
    string[] public jobIds;
    mapping(string => jobPosting) public jobsposting;
    mapping(string => address) public jobOwner;

    // Mapping 1: Stores the list of jobs applied to by a user
    mapping(address => string[]) public appliedJobs;

    // Mapping 2: Stores the application status for a specific job and applicant
    // Key: jobId => applicantAddress => Status
    mapping(string => mapping(address => ApplicationStatus))
        public applicationStatus;

    // 3. Events
    event Applied(address indexed user, string jobId);
    event StatusUpdated(
        address indexed user,
        string indexed jobId,
        ApplicationStatus newStatus
    );

    // 4. Job Posting Functions
    function posting(
        string memory _id,
        string memory _title,
        string memory _description,
        string memory _budget,
        string[] memory _tools
    ) public {
        // Basic check to prevent ID reuse (good practice)
        require(
            bytes(jobsposting[_id].title).length == 0,
            "Job ID already exists"
        );

        jobsposting[_id] = jobPosting(_title, _description, _budget, _tools);
        jobIds.push(_id);
        jobOwner[_id] = msg.sender;
    }

    function totalJobs() public view returns (uint256) {
        return jobIds.length;
    }

    function getJob(
        string memory _id
    )
        public
        view
        returns (
            string memory title,
            string memory description,
            string memory budget,
            string[] memory tools
        )
    {
        jobPosting storage j = jobsposting[_id];
        return (j.title, j.description, j.budget, j.tools);
    }

    // 5. Job Application Functions
    function applyJob(string memory _id) public {
        // Prevent duplicate apply (using a common optimization pattern)
        string[] storage list = appliedJobs[msg.sender];
        for (uint i = 0; i < list.length; i++) {
            if (keccak256(bytes(list[i])) == keccak256(bytes(_id))) {
                revert("Already Applied");
            }
        }

        // Save applied job
        list.push(_id);

        // 💡 CRITICAL FIX: Initialize status to Pending (0)
        applicationStatus[_id][msg.sender] = ApplicationStatus.Pending;

        emit Applied(msg.sender, _id);
    }

    function getAppliedJobs(
        address user
    ) public view returns (string[] memory) {
        return appliedJobs[user];
    }

    // NEW: Get the current application status for a specific job and user
    function getApplicationStatus(
        string memory _id,
        address _applicant
    ) public view returns (ApplicationStatus) {
        return applicationStatus[_id][_applicant];
    }

    // NEW: Function for the Job Owner to change the application status
    function updateApplicationStatus(
        string memory _id,
        address _applicant,
        ApplicationStatus _newStatus
    ) public {
        // Only the job owner can call this
        require(jobOwner[_id] == msg.sender, "Not the job owner");

        // Ensure the job exists and the applicant has applied (optional but good)
        // Note: The getter will return Pending(0) if not applied, which is fine

        // Update the status
        applicationStatus[_id][_applicant] = _newStatus;

        emit StatusUpdated(_applicant, _id, _newStatus);
    }

    mapping(string => mapping(address => bool)) public jobCompleted;

    function markCompleted(string memory _id) public {
        // Only accepted applicant can mark complete
        require(
            applicationStatus[_id][msg.sender] == ApplicationStatus.Accepted,
            "Not accepted for this job"
        );

        jobCompleted[_id][msg.sender] = true;
    }
}
