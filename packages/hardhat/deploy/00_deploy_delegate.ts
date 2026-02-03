import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

// The real ERC-8004 registry address on mainnet
const ERC8004_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";

const deployDelegate: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy RegistrationDelegate pointing to the real registry
  const delegate = await deploy("RegistrationDelegate", {
    from: deployer,
    args: [ERC8004_REGISTRY],
    log: true,
    autoMine: true,
  });

  console.log("✅ RegistrationDelegate deployed to:", delegate.address);

  // Deploy SponsorHelper
  const helper = await deploy("SponsorHelper", {
    from: deployer,
    args: [delegate.address, ERC8004_REGISTRY],
    log: true,
    autoMine: true,
  });

  console.log("✅ SponsorHelper deployed to:", helper.address);
  console.log("\n📝 ERC-8004 Registry:", ERC8004_REGISTRY);
};

export default deployDelegate;

deployDelegate.tags = ["RegistrationDelegate", "SponsorHelper"];
