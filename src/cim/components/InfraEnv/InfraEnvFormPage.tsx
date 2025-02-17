import * as React from 'react';
import * as Yup from 'yup';
import {
  Alert,
  AlertActionCloseButton,
  AlertVariant,
  Button,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  Grid,
  GridItem,
  Spinner,
  Stack,
  StackItem,
  Title,
  TitleSizes,
} from '@patternfly/react-core';
import { Formik, FormikProps, useFormikContext } from 'formik';

import {
  httpProxyValidationSchema,
  InputField,
  noProxyValidationSchema,
  PullSecretField,
  sshPublicKeyValidationSchema,
  LabelField,
  UploadSSH,
  ProxyFields,
  RadioField,
  PopoverIcon,
  pullSecretValidationSchema,
} from '../../../common';

import './infra-env.css';

export type EnvironmentStepFormValues = {
  name: string;
  location: string;
  pullSecret: string;
  sshPublicKey: string;
  httpProxy: string;
  httpsProxy: string;
  noProxy: string;
  enableProxy: boolean;
  labels: string[];
  networkType: 'dhcp' | 'static';
};

const validationSchema = (usedNames: string[]) =>
  Yup.lazy<EnvironmentStepFormValues>((values) =>
    Yup.object<EnvironmentStepFormValues>().shape({
      name: Yup.string()
        .required('Name is a required field.')
        .test(
          'duplicate-name',
          'Infrastructure environment with the same name already exists!',
          (value: string) => !usedNames.find((n) => n === value),
        ),
      location: Yup.string().required('Location is a required field.'),
      pullSecret: pullSecretValidationSchema.required('Pull secret is a required field.'),
      sshPublicKey: sshPublicKeyValidationSchema.required(
        'An SSH key is required to debug hosts as they register.',
      ),
      httpProxy: httpProxyValidationSchema(values, 'httpsProxy'),
      httpsProxy: httpProxyValidationSchema(values, 'httpProxy'), // share the schema, httpS is currently not supported
      noProxy: noProxyValidationSchema,
      labels: Yup.array()
        .of(Yup.string())
        .test(
          'label-equals-validation',
          'Label selector needs to be in a `key=value` form',
          (values: string[]) =>
            values.every((value) => {
              const parts = value.split('=');
              return parts.length === 2;
            }),
        ),
    }),
  );

const initialValues: EnvironmentStepFormValues = {
  name: '',
  location: '',
  pullSecret: '',
  sshPublicKey: '',
  httpProxy: '',
  httpsProxy: '',
  noProxy: '',
  enableProxy: false,
  labels: [],
  networkType: 'dhcp',
};

type InfraEnvFormProps = {
  onValuesChanged?: (values: EnvironmentStepFormValues) => void;
  isBMPlatform: boolean;
};

const InfraEnvForm: React.FC<InfraEnvFormProps> = ({ onValuesChanged, isBMPlatform }) => {
  const { values } = useFormikContext<EnvironmentStepFormValues>();
  React.useEffect(() => onValuesChanged?.(values), [onValuesChanged, values]);
  return (
    <Stack hasGutter>
      <StackItem>
        Infrastructure environments are used by clusters. Create an infrastructure environment to
        add resources to your cluster.
      </StackItem>
      <StackItem>
        <Form>
          <InputField
            label="Name"
            name="name"
            placeholder="Enter infrastructure environment name"
            isRequired
          />
          <FormGroup
            fieldId="network-type"
            label="Network type"
            labelIcon={
              <PopoverIcon
                noVerticalAlign
                bodyContent={
                  <>
                    This will determine for the infrastructure environment which kind of hosts would
                    be able to be added. If the hosts that you want to add are using DHCP server,
                    select this option, else, select the static IP.
                    {!isBMPlatform && (
                      // TODO(mlibra): This limitation needs to be updated once https://github.com/openshift/enhancements/pull/871 lands.
                      <>
                        <br />
                        Static IPs are only supported on bare metal platforms.
                      </>
                    )}
                  </>
                }
              />
            }
          >
            <Flex justifyContent={{ default: 'justifyContentFlexStart' }}>
              <FlexItem>
                <RadioField name="networkType" id="dhcp" value="dhcp" label="Use DHCP server" />
              </FlexItem>
              <FlexItem spacer={{ default: 'spacer4xl' }} />
              <FlexItem>
                <RadioField
                  name="networkType"
                  id="static-ip"
                  value="static"
                  label="Use static IP"
                  isDisabled={!isBMPlatform}
                />
              </FlexItem>
            </Flex>
          </FormGroup>
          <InputField
            label="Location"
            name="location"
            placeholder="Enter geographic location for the environment"
            helperText="Used to describe hosts' physical location. Helps for quicker host selection during cluster creation."
            isRequired
          />
          <LabelField label="Labels" name="labels" />
          <PullSecretField isOcm={false} />
          <UploadSSH />
          <ProxyFields />
        </Form>
      </StackItem>
    </Stack>
  );
};

type InfraEnvFormPageProps = InfraEnvFormProps & {
  usedNames: string[];
  isBMPlatform: boolean;
  // eslint-disable-next-line
  onSubmit?: (values: EnvironmentStepFormValues) => Promise<any>;
  onFinish?: (values: EnvironmentStepFormValues) => void;
  onClose?: VoidFunction;
};

export const InfraEnvFormPage: React.FC<InfraEnvFormPageProps> = ({
  usedNames,
  isBMPlatform,
  onSubmit,
  onClose,
  onFinish,
  onValuesChanged,
}) => {
  const [error, setError] = React.useState<string | undefined>();
  return (
    <Formik
      initialValues={initialValues}
      initialStatus={{ error: null }}
      validationSchema={validationSchema(usedNames)}
      onSubmit={async (values: EnvironmentStepFormValues) => {
        try {
          await onSubmit?.(values);
          onFinish?.(values);
        } catch (e) {
          setError(e?.message ?? 'An error occured');
        }
      }}
    >
      {({ isValid, isSubmitting, submitForm }: FormikProps<EnvironmentStepFormValues>) => (
        <Stack hasGutter>
          <StackItem>
            {onSubmit && onClose ? (
              <Grid hasGutter span={8}>
                <GridItem>
                  <Title headingLevel="h1" size={TitleSizes.xl}>
                    Configure environment
                  </Title>
                </GridItem>
                <GridItem>
                  <InfraEnvForm onValuesChanged={onValuesChanged} isBMPlatform={isBMPlatform} />
                </GridItem>
              </Grid>
            ) : (
              <div className="infra-env__form">
                <InfraEnvForm onValuesChanged={onValuesChanged} isBMPlatform={isBMPlatform} />
              </div>
            )}
          </StackItem>
          {error && (
            <StackItem>
              <Alert
                variant={AlertVariant.danger}
                actionClose={<AlertActionCloseButton onClose={() => setError(undefined)} />}
                title="Error creating InfraEnv"
              >
                {error}
              </Alert>
            </StackItem>
          )}
          {onSubmit && onClose && (
            <StackItem>
              <>
                <Button
                  variant="primary"
                  type="submit"
                  isDisabled={!isValid || isSubmitting}
                  onClick={submitForm}
                >
                  Create {isSubmitting && <Spinner isSVG size="md" />}
                </Button>
                <Button variant="link" onClick={onClose} isDisabled={isSubmitting}>
                  Cancel
                </Button>
              </>
            </StackItem>
          )}
        </Stack>
      )}
    </Formik>
  );
};
