import React from 'react';
import { Button, Modal, ButtonVariant, ModalVariant, ModalBoxBody } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { global_warning_color_100 as globalWarningColor100 } from '@patternfly/react-tokens';
import { ToolbarButton } from './Toolbar';
import { Cluster, Event } from '../../api';
import { EventListFetchProps, EventsEntityKind } from '../../types';
import { EventListFetch } from '../fetching/EventListFetch';
import ExternalLink from './ExternalLink';
import ErrorState from './uiState/ErrorState';

import './EventsModal.css';

type EventsModalButtonProps = React.ComponentProps<typeof Button> & {
  ButtonComponent?: typeof Button | typeof ToolbarButton;
  onFetchEvents: EventListFetchProps['onFetchEvents'];
  onClick?: () => void;
  hostId?: Event['hostId'];
  cluster: Cluster;
  entityKind: EventsEntityKind;
  title: string;
  fallbackEventsURL?: string;
};

export const EventsModalButton: React.FC<EventsModalButtonProps> = ({
  ButtonComponent = ToolbarButton,
  onFetchEvents,
  onClick,
  hostId,
  cluster,
  entityKind,
  children,
  title,
  fallbackEventsURL,
  ...props
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const closeModal = () => setIsModalOpen(false);
  const handleClick = onClick || (() => setIsModalOpen(true));
  return (
    <>
      <ButtonComponent {...props} onClick={handleClick}>
        {children || title}
      </ButtonComponent>
      <EventsModal
        title={title}
        isOpen={isModalOpen}
        onClose={closeModal}
        hostId={hostId}
        cluster={cluster}
        entityKind={entityKind}
        onFetchEvents={onFetchEvents}
        fallbackEventsURL={fallbackEventsURL}
      />
    </>
  );
};

type EventsModalProps = {
  onFetchEvents: EventListFetchProps['onFetchEvents'];
  hostId: Event['hostId'];
  cluster: Cluster;
  entityKind: EventsEntityKind;
  onClose: () => void;
  isOpen: boolean;
  title: string;
  fallbackEventsURL?: string;
};

export const EventsModal: React.FC<EventsModalProps> = ({
  onFetchEvents,
  hostId,
  cluster,
  entityKind,
  onClose,
  isOpen,
  title,
  fallbackEventsURL,
}) => {
  return (
    <Modal
      title={title}
      isOpen={isOpen}
      aria-label="Displays events"
      hasNoBodyWrapper
      actions={[
        <Button key="close" variant={ButtonVariant.primary} onClick={onClose}>
          Close
        </Button>,
      ]}
      onClose={onClose}
      variant={ModalVariant.large}
      className="events-modal"
    >
      <ModalBoxBody className="events-modal__body">
        {fallbackEventsURL ? (
          <ErrorState
            title="Could not load events"
            content={
              <>
                Could not load events from the standard location. You can check the events in
                the&nbsp;
                <ExternalLink href={fallbackEventsURL}>raw format</ExternalLink>.
              </>
            }
            icon={ExclamationTriangleIcon}
            iconColor={globalWarningColor100.value}
          />
        ) : (
          <EventListFetch
            hostId={hostId}
            cluster={cluster}
            entityKind={entityKind}
            onFetchEvents={onFetchEvents}
            className="events-modal__event-list"
          />
        )}
      </ModalBoxBody>
    </Modal>
  );
};
