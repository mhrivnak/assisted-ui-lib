import { CheckCircleIcon, InfoCircleIcon } from '@patternfly/react-icons';
import React from 'react';
import { global_success_color_100 as okColor } from '@patternfly/react-tokens';
import { TextList, TextListItem, TextContent } from '@patternfly/react-core';
import {
  FeatureId,
  FeatureIdToSupportLevel,
  PreviewSupportLevel,
  isPreviewSupportLevel,
} from '../../../common/types';
import { TECH_SUPPORT_LEVEL_LINK } from '../../../common/config/constants';
import ExternalLink from '../../../common/components/ui/ExternalLink';
import { isFullySupported } from './utils';

export type SupportLevelSummary = {
  unsupportedVms: boolean;
  featureIds: FeatureId[];
  supportLevel: PreviewSupportLevel;
};

const getFeatureReviewText = (featureId: FeatureId): string => {
  switch (featureId) {
    case 'SNO':
      return 'Install single node OpenShift (SNO)';
    case 'VIP_AUTO_ALLOC':
      return 'Allocate virtual IPs via DHCP server';
    default:
      return featureId;
  }
};

const getPreviewSupportLevelTitle = (supportLevel: PreviewSupportLevel) => {
  if (supportLevel === 'dev-preview') {
    return 'Developer Preview Features';
  }
  return <ExternalLink href={TECH_SUPPORT_LEVEL_LINK}>Technology Preview Features</ExternalLink>;
};

const getPreviewFeatureList = (supportLevelMap: FeatureIdToSupportLevel) => {
  const previewSupportLevels: { [key in PreviewSupportLevel]: FeatureId[] } = {
    'tech-preview': [],
    'dev-preview': [],
  };
  for (const [featureId, supportLevel] of Object.entries(supportLevelMap)) {
    if (!isPreviewSupportLevel(supportLevel)) {
      continue;
    }
    previewSupportLevels[supportLevel].push(featureId as FeatureId);
  }
  let supportLevel: PreviewSupportLevel;
  //Show only one preview support level list, first priority to developer preview features
  if (previewSupportLevels['dev-preview'].length) {
    supportLevel = 'dev-preview';
  } else if (previewSupportLevels['tech-preview'].length) {
    supportLevel = 'tech-preview';
  } else {
    return null;
  }
  const featureList = previewSupportLevels[supportLevel].map((featureId: FeatureId) => (
    <TextListItem key={featureId}>{getFeatureReviewText(featureId)}</TextListItem>
  ));
  return (
    <>
      <TextListItem>
        {getPreviewSupportLevelTitle(supportLevel)}
        <TextList>{featureList}</TextList>
      </TextListItem>
    </>
  );
};

type LimitedSupportedClusterProps = {
  clusterFeatureSupportLevels: FeatureIdToSupportLevel;
};

const LimitedSupportedCluster: React.FC<LimitedSupportedClusterProps> = ({
  clusterFeatureSupportLevels,
}) => (
  <TextContent>
    <InfoCircleIcon size="sm" color="var(--pf-global--info-color--100)" />
    &nbsp;Your cluster will be subject to support limitations because it includes:
    <TextList>
      {getPreviewFeatureList(clusterFeatureSupportLevels)}
      {clusterFeatureSupportLevels['CLUSTER_MANAGED_NETWORKING_WITH_VMS'] === 'unsupported' && (
        <TextListItem>
          Cluster-managed networking with some or all discovered hosts as virtual machines
        </TextListItem>
      )}
    </TextList>
  </TextContent>
);

const FullySupportedCluster: React.FC = () => (
  <>
    <CheckCircleIcon color={okColor.value} />
    &nbsp;Your installed cluster will be fully supported
  </>
);

export type ReviewClusterFeatureSupportLevelsProps = {
  clusterFeatureSupportLevels: FeatureIdToSupportLevel | undefined;
};

const ReviewClusterFeatureSupportLevels: React.FC<ReviewClusterFeatureSupportLevelsProps> = ({
  clusterFeatureSupportLevels,
}) => {
  if (!clusterFeatureSupportLevels) {
    return null;
  }
  const fullySupported = isFullySupported(clusterFeatureSupportLevels);
  return fullySupported ? (
    <FullySupportedCluster />
  ) : (
    <LimitedSupportedCluster clusterFeatureSupportLevels={clusterFeatureSupportLevels} />
  );
};

export default ReviewClusterFeatureSupportLevels;
