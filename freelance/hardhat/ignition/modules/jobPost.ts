import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("postJobModule", (m) => {
  const jobpost = m.contract("postJob");


  return { jobpost };
});
