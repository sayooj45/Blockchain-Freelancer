// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract postJob {
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

    struct CompletedJobData {
        address freelancer;
        string jobId;
        string budget;
        uint256 timestamp;
    }

    string[] public jobIds;
    mapping(string => jobPosting) public jobsposting;
    mapping(string => address) public jobOwner;

    // Job Application Status
    mapping(address => string[]) public appliedJobs;
    mapping(string => mapping(address => ApplicationStatus))
        public applicationStatus;

    // Job Completion and Payment Status
    CompletedJobData[] public completedJobsList;
    mapping(string => bool) public isJobCompleted;

    mapping(string => mapping(address => bool)) public isJobPaid;

    event Applied(address indexed user, string jobId);

    event StatusUpdated(
        address indexed user,
        string indexed jobId,
        ApplicationStatus newStatus
    );

    event JobCompleted(address indexed freelancer, string jobId, string budget);

    event JobFinalizedAndPaid(
        address indexed payer,
        address indexed freelancer,
        string jobId,
        uint256 amount
    );

    function posting(
        string memory _id,
        string memory _title,
        string memory _description,
        string memory _budget,
        string[] memory _tools
    ) public {
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

    function applyJob(string memory _id) public {
        string[] storage list = appliedJobs[msg.sender];
        for (uint i = 0; i < list.length; i++) {
            if (keccak256(bytes(list[i])) == keccak256(bytes(_id))) {
                revert("Already Applied");
            }
        }

        list.push(_id);
        applicationStatus[_id][msg.sender] = ApplicationStatus.Pending;

        emit Applied(msg.sender, _id);
    }

    function getAppliedJobs(
        address user
    ) public view returns (string[] memory) {
        return appliedJobs[user];
    }

    function getApplicationStatus(
        string memory _id,
        address _applicant
    ) public view returns (ApplicationStatus) {
        return applicationStatus[_id][_applicant];
    }

    // Function for the Job Owner to Accept/Reject
    function updateApplicationStatus(
        string memory _id,
        address _applicant,
        ApplicationStatus _newStatus
    ) public {
        require(jobOwner[_id] == msg.sender, "Not the job owner");
        applicationStatus[_id][_applicant] = _newStatus;
        emit StatusUpdated(_applicant, _id, _newStatus);
    }

    // This is called by the Freelancer when they finish the work
    function completeJob(string memory _id) public {
        require(!isJobCompleted[_id], "Job is already completed");

        // 2. Check if the caller is the accepted freelancer
        require(
            applicationStatus[_id][msg.sender] == ApplicationStatus.Accepted,
            "You are not the accepted freelancer"
        );

        // 3. Retrieve budget from the original job posting
        jobPosting storage job = jobsposting[_id];
        string memory _budget = job.budget;

        // 4. Store the completion data
        completedJobsList.push(
            CompletedJobData({
                freelancer: msg.sender,
                jobId: _id,
                budget: _budget,
                timestamp: block.timestamp
            })
        );

        // 5. Mark job as completed
        isJobCompleted[_id] = true;

        // 6. Emit event
        emit JobCompleted(msg.sender, _id, _budget);
    }

    // Helper to get all completed jobs
    function getAllCompletedJobs()
        public
        view
        returns (CompletedJobData[] memory)
    {
        return completedJobsList;
    }

    /**
     * @notice Called by the Job Owner to accept the work and transfer the payment to the freelancer.
     * @param _id The job ID.
     * @param _freelancer The address of the accepted freelancer.
     */
    function acceptWorkAndPay(
        string memory _id,
        address _freelancer
    ) public payable {
        // 1. Authorization and Status Checks
        require(jobOwner[_id] == msg.sender, "Not the job owner");
        require(
            applicationStatus[_id][_freelancer] == ApplicationStatus.Accepted,
            "Freelancer not accepted"
        );
        require(
            isJobCompleted[_id],
            "Work has not been completed by freelancer"
        );
        require(!isJobPaid[_id][_freelancer], "Job is already paid");

        // The job owner must attach the payment value (msg.value) in the transaction.
        uint256 paymentAmount = msg.value;

        // 2. Transfer funds to the Freelancer
        (bool success, ) = payable(_freelancer).call{value: paymentAmount}("");
        require(success, "Payment transfer failed");

        isJobPaid[_id][_freelancer] = true;

        emit JobFinalizedAndPaid(msg.sender, _freelancer, _id, paymentAmount);
    }
}
