import * as React from 'react';
import { getFailingResourceConditions } from '../helpers';
import { InfraEnvK8sResource } from '../../types';
import { SingleResourceAlerts } from '../common/ResourceAlerts';
import { Alert, AlertVariant } from '@patternfly/react-core';
import { getInfraEnvDocs } from '../common/constants';

export type EnvironmentErrorsProps = {
  infraEnv: InfraEnvK8sResource;
  docVersion: string;
};

export const EnvironmentErrors: React.FC<EnvironmentErrorsProps> = ({ infraEnv, docVersion }) => {
  const infraEnvAlerts = getFailingResourceConditions(infraEnv, undefined /* For ALL */);

  return (
    <>
      {!infraEnv.status && (
        <Alert
          title="Central infrastructure management is not running"
          variant={AlertVariant.warning}
          isInline
          className="cim-resource-alerts"
          actionLinks={
            <a href={getInfraEnvDocs(docVersion)} target="_blank" rel="noopener noreferrer">
              Open documentation
            </a>
          }
        >
          It seems the Central infrastructure management is not configured which will prevent its
          features to be used. Please refer to the documentation for the first time setup steps.
        </Alert>
      )}
      <SingleResourceAlerts
        title="Failing infrastructure environment"
        conditions={infraEnvAlerts}
      />
    </>
  );
};
