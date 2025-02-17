import React from 'react';
import { Link } from 'react-router-dom';
import {
  Stack,
  StackItem,
  TextContent,
  Text,
  ButtonVariant,
  GridItem,
  Grid,
  Alert,
} from '@patternfly/react-core';
import {
  Cluster,
  ToolbarButton,
  ToolbarSecondaryGroup,
  Alerts,
  canDownloadClusterLogs,
  useAlerts,
  RenderIf,
  KubeconfigDownload,
} from '../../../common';
import ClusterHostsTable from '../hosts/ClusterHostsTable';
import ClusterToolbar from '../clusters/ClusterToolbar';
import { downloadClusterInstallationLogs, getClusterDetailId } from './utils';
import { LaunchOpenshiftConsoleButton } from '../../../common/components/clusterDetail/ConsoleModal';
import ClusterProperties from './ClusterProperties';
import { isSingleClusterMode, routeBasePath } from '../../config';
import ClusterDetailStatusVarieties, {
  useClusterStatusVarieties,
} from './ClusterDetailStatusVarieties';
import { useModalDialogsContext } from '../hosts/ModalDialogsContext';
import { canAbortInstallation } from '../clusters/utils';
import { useDefaultConfiguration } from '../clusterConfiguration/ClusterDefaultConfigurationContext';
import ClusterProgress from '../../../common/components/clusterDetail/ClusterProgress';
import { EventsModalButton } from '../../../common/components/ui/eventsModal';
import { onFetchEvents } from '../fetching/fetchEvents';
import { VSPHERE_CONFIG_LINK } from '../../../common/config/constants';

type ClusterDetailProps = {
  cluster: Cluster;
};

const ClusterDetail: React.FC<ClusterDetailProps> = ({ cluster }) => {
  const { addAlert } = useAlerts();
  const { resetClusterDialog, cancelInstallationDialog } = useModalDialogsContext();
  const clusterVarieties = useClusterStatusVarieties(cluster);
  const { credentials, credentialsError } = clusterVarieties;
  const { inactiveDeletionHours } = useDefaultConfiguration(['inactiveDeletionHours']);
  const inactiveDeletionDays = Math.round((inactiveDeletionHours || 0) / 24);

  return (
    <Stack hasGutter>
      <StackItem>
        <Grid hasGutter>
          <GridItem>
            <TextContent>
              <Text component="h2">Installation progress</Text>
            </TextContent>
          </GridItem>
          <GridItem>
            <ClusterProgress
              cluster={cluster}
              onFetchEvents={onFetchEvents}
              totalPercentage={cluster.progress?.totalPercentage || 0}
            />
          </GridItem>
          <ClusterDetailStatusVarieties cluster={cluster} clusterVarieties={clusterVarieties} />
          <GridItem>
            <KubeconfigDownload
              status={cluster.status}
              clusterId={cluster.id}
              id={getClusterDetailId('button-download-kubeconfig')}
            />
          </GridItem>
          <RenderIf condition={typeof inactiveDeletionHours === 'number'}>
            <Alert
              variant="info"
              isInline
              title={
                'Download and save your kubeconfig file in a safe place. This file will be ' +
                "automatically deleted from Assisted Installer's service " +
                `${inactiveDeletionDays > 0 ? `in ${inactiveDeletionDays} days.` : 'today'}`
              }
            />
          </RenderIf>
          <RenderIf condition={cluster.platform?.type !== 'baremetal'}>
            <Alert
              variant="warning"
              isInline
              title={
                <p>
                  Modify your platform configuration to access your platform's features directly in
                  OpenShift.{' '}
                  <a href={VSPHERE_CONFIG_LINK} target="_blank" rel="noopener noreferrer">
                    Learn more about configuration <i className="fas fa-external-link-alt" />
                  </a>
                </p>
              }
            />
          </RenderIf>
          <GridItem>
            <TextContent>
              <Text component="h2">Host Inventory</Text>
            </TextContent>
            <ClusterHostsTable cluster={cluster} skipDisabled />
          </GridItem>
          <ClusterProperties cluster={cluster} />
        </Grid>
      </StackItem>
      <StackItem>
        <Alerts />
      </StackItem>
      <StackItem>
        <ClusterToolbar>
          {canAbortInstallation(cluster) && (
            <ToolbarButton
              id={getClusterDetailId('button-cancel-installation')}
              variant={ButtonVariant.danger}
              onClick={() => cancelInstallationDialog.open({ clusterId: cluster.id })}
            >
              Abort Installation
            </ToolbarButton>
          )}
          {cluster.status === 'error' && (
            <ToolbarButton
              id={getClusterDetailId('button-reset-cluster')}
              onClick={() => resetClusterDialog.open({ cluster })}
            >
              Reset Cluster
            </ToolbarButton>
          )}
          {['finalizing', 'installed'].includes(cluster.status) && (
            <LaunchOpenshiftConsoleButton
              isDisabled={!credentials || !!credentialsError}
              cluster={cluster}
              consoleUrl={credentials?.consoleUrl}
              id={getClusterDetailId('button-launch-console')}
            />
          )}
          {!isSingleClusterMode() && (
            <ToolbarButton
              variant={ButtonVariant.link}
              component={(props) => <Link to={`${routeBasePath}/clusters`} {...props} />}
              id={getClusterDetailId('button-back-to-all-clusters')}
            >
              Back to all clusters
            </ToolbarButton>
          )}
          <ToolbarSecondaryGroup>
            <ToolbarButton
              id="cluster-installation-logs-button"
              variant={ButtonVariant.link}
              onClick={() => downloadClusterInstallationLogs(addAlert, cluster.id)}
              isDisabled={!canDownloadClusterLogs(cluster)}
            >
              Download Installation Logs
            </ToolbarButton>
            <EventsModalButton
              id="cluster-events-button"
              entityKind="cluster"
              cluster={cluster}
              title="Cluster Events"
              variant={ButtonVariant.link}
              onFetchEvents={onFetchEvents}
            >
              View Cluster Events
            </EventsModalButton>
          </ToolbarSecondaryGroup>
        </ClusterToolbar>
      </StackItem>
    </Stack>
  );
};

export default ClusterDetail;
