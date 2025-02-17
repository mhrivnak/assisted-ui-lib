import React from 'react';
import { Text, TextContent, Button, Stack, StackItem, Tooltip } from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';
import {
  Cluster,
  PopoverIcon,
  CheckboxField,
  useFeature,
  isSingleNodeCluster,
  ClusterWizardStepHeader,
  DiscoveryTroubleshootingModal,
  DiscoveryInstructions,
  SwitchField,
  schedulableMastersAlwaysOn,
  HostDiscoveryValues,
  getSchedulableMasters,
} from '../../../common';
import HostsDiscoveryTable from '../hosts/HostsDiscoveryTable';
import { DiscoveryImageModalButton } from './discoveryImageModal';
import InformationAndAlerts from './InformationAndAlerts';
import {
  HostRequirementsContent,
  SingleHostRequirementsContent,
  CNVHostRequirementsContent,
} from '../hosts/HostRequirementsContent';
import ClusterWizardHeaderExtraActions from './ClusterWizardHeaderExtraActions';
import { useClusterSupportedPlatforms } from '../../hooks';
import { useFormikContext } from 'formik';

const OCSLabel: React.FC = () => (
  <>
    Install OpenShift Container Storage
    {/* TODO(mlibra): List of OCS requierements is stabilizing now - https://issues.redhat.com/browse/MGMT-4220 )
    <PopoverIcon
      component={'a'}
      variant={'plain'}
      IconComponent={HelpIcon}
      minWidth="50rem"
      headerContent="Additional Requirements"
      bodyContent={<>FOO BAR </>}/>
    */}
  </>
);

const CNVLabel: React.FC<{ clusterId: Cluster['id']; isSingleNode?: boolean }> = ({
  clusterId,
  isSingleNode,
}) => {
  return (
    <>
      Install OpenShift Virtualization{' '}
      <PopoverIcon
        component={'a'}
        variant={'plain'}
        IconComponent={HelpIcon}
        minWidth="50rem"
        headerContent="Additional Requirements"
        bodyContent={
          <CNVHostRequirementsContent clusterId={clusterId} isSingleNode={isSingleNode} />
        }
      />
    </>
  );
};

const PlatformIntegrationLabel: React.FC<{ isTooltipHidden: boolean }> = ({
  isTooltipHidden = false,
}) => (
  <>
    <Tooltip
      hidden={isTooltipHidden}
      content={
        'Platform integration is applicable only when all discovered hosts are from the same platform'
      }
    >
      <span>Integrate with platform</span>
    </Tooltip>{' '}
    <PopoverIcon
      variant={'plain'}
      bodyContent={
        <p>
          Enable platform integration to access your platform's features directly in OpenShift.
          <br />
          <strong>Note:</strong> You will need to modify your platform configuration after cluster
          installation is completed.
        </p>
      }
    />
  </>
);

const SchedulableMastersLabel: React.FC<{ isTooltipHidden: boolean }> = ({
  isTooltipHidden = false,
}) => (
  <>
    <Tooltip
      hidden={isTooltipHidden}
      content={'This toggle will be "On" and not editable when less than 5 hosts were discovered'}
    >
      <span>Run workloads on control plane nodes</span>
    </Tooltip>{' '}
    <PopoverIcon
      variant={'plain'}
      bodyContent={<p>Enables your control plane nodes to be used for running applications.</p>}
    />
  </>
);

const HostInventory: React.FC<{ cluster: Cluster }> = ({ cluster }) => {
  const [isDiscoveryHintModalOpen, setDiscoveryHintModalOpen] = React.useState(false);
  const { isPlatformIntegrationSupported } = useClusterSupportedPlatforms(cluster.id);
  const isPlatformIntegrationFeatureEnabled = useFeature(
    'ASSISTED_INSTALLER_PLATFORM_INTEGRATION_FEATURE',
  );
  const isOpenshiftClusterStorageEnabled = useFeature('ASSISTED_INSTALLER_OCS_FEATURE');
  const isContainerNativeVirtualizationEnabled = useFeature('ASSISTED_INSTALLER_CNV_FEATURE');
  const isSNO = isSingleNodeCluster(cluster);
  const isSchedulableMastersEnabled = !schedulableMastersAlwaysOn(cluster);
  const { setFieldValue } = useFormikContext<HostDiscoveryValues>();
  React.useEffect(() => {
    setFieldValue('schedulableMasters', getSchedulableMasters(cluster));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSchedulableMastersEnabled]); //just when changes from disabled to enabled, shouldn't respond to continous polling otherwise
  return (
    <Stack hasGutter>
      <StackItem>
        <ClusterWizardStepHeader extraItems={<ClusterWizardHeaderExtraActions cluster={cluster} />}>
          Host discovery
        </ClusterWizardStepHeader>
      </StackItem>
      <StackItem>
        <TextContent>
          <DiscoveryInstructions isSingleNodeCluster={isSNO} />
          <Text component="p">
            <DiscoveryImageModalButton
              ButtonComponent={Button}
              cluster={cluster}
              idPrefix="host-inventory"
            />
          </Text>
        </TextContent>
      </StackItem>
      <StackItem>
        {isContainerNativeVirtualizationEnabled && (
          <CheckboxField
            name="useContainerNativeVirtualization"
            label={<CNVLabel clusterId={cluster.id} isSingleNode={isSNO} />}
            helperText="Run virtual machines along containers."
          />
        )}
      </StackItem>
      <StackItem>
        {isOpenshiftClusterStorageEnabled && !isSNO && (
          <CheckboxField
            name="useExtraDisksForLocalStorage"
            label={<OCSLabel />}
            helperText="Persistent software-defined storage for hybrid applications."
          />
        )}
      </StackItem>
      <StackItem>
        {isPlatformIntegrationFeatureEnabled && (
          <SwitchField
            isDisabled={!isPlatformIntegrationSupported && cluster?.platform?.type === 'baremetal'}
            name={'usePlatformIntegration'}
            label={<PlatformIntegrationLabel isTooltipHidden={isPlatformIntegrationSupported} />}
          />
        )}
      </StackItem>
      <StackItem>
        <SwitchField
          isDisabled={!isSchedulableMastersEnabled}
          name={'schedulableMasters'}
          label={<SchedulableMastersLabel isTooltipHidden={isSchedulableMastersEnabled} />}
        />
      </StackItem>
      <StackItem>
        <TextContent>
          <InformationAndAlerts
            cluster={cluster}
            HostRequirementsContent={
              isSNO ? SingleHostRequirementsContent : HostRequirementsContent
            }
            setDiscoveryHintModalOpen={setDiscoveryHintModalOpen}
          />
        </TextContent>
      </StackItem>
      <StackItem>
        <HostsDiscoveryTable
          cluster={cluster}
          setDiscoveryHintModalOpen={setDiscoveryHintModalOpen}
        />
      </StackItem>
      <DiscoveryTroubleshootingModal
        isOpen={isDiscoveryHintModalOpen}
        setDiscoveryHintModalOpen={setDiscoveryHintModalOpen}
      />
    </Stack>
  );
};
export default HostInventory;
