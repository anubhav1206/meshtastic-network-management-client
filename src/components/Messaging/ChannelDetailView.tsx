import React from "react";
import { useDispatch, useSelector } from "react-redux";
// import { MapPinIcon, PencilIcon } from "@heroicons/react/24/outline";
import { PencilIcon } from "@heroicons/react/24/outline";

import type { app_device_MeshChannel } from "@bindings/index";

import ConfigTitlebar from "@components/config/ConfigTitlebar";
// import MapIconButton from "@components/Map/MapIconButton";
import TextMessageBubble from "@components/Messaging/TextMessageBubble";
import MessagingInput from "@components/Messaging/MessagingInput";

import { requestSendMessage } from "@features/device/deviceActions";
import { selectPrimarySerialPort } from "@features/device/deviceSelectors";
import { getChannelName, getNumMessagesText } from "@utils/messaging";

export interface IChannelDetailViewProps {
  channel: app_device_MeshChannel;
  className?: string;
}

const ChannelDetailView = ({
  channel,
  className = "",
}: IChannelDetailViewProps) => {
  const dispatch = useDispatch();
  const primaryPortName = useSelector(selectPrimarySerialPort());

  const handleMessageSubmit = (message: string) => {
    if (!message) {
      alert("Empty message");
      return;
    }

    if (!primaryPortName) {
      console.warn("No primary serial port, not sending message");
      return;
    }

    dispatch(
      requestSendMessage({
        portName: primaryPortName,
        text: message,
        channel: channel.config.index,
      })
    );
  };

  return (
    <div className={`${className} flex-1 h-screen`}>
      <ConfigTitlebar
        title={getChannelName(channel)}
        subtitle={getNumMessagesText(channel.messages.length)}
        renderIcon={(c) => <PencilIcon className={`${c}`} />}
        onIconClick={() => alert("incomplete feature")}
      >
        <div className="flex flex-1 flex-col gap-6 mb-9 overflow-y-auto">
          {channel.messages.map((m) => (
            <TextMessageBubble
              className="pr-6"
              message={m}
              key={m.payload.packet.id}
            />
          ))}
        </div>

        <div className="flex flex-row gap-4">
          <MessagingInput
            placeholder="Send message"
            onSubmit={handleMessageSubmit}
            className="w-full flex-1"
          />
          {/* <MapIconButton
            className="w-12 h-12 no-shadow"
            onClick={() => console.log('Clicked "send waypoint" button')}
          >
            <MapPinIcon className="m-auto w-6 h-6 text-gray-400" />
          </MapIconButton> */}
        </div>
      </ConfigTitlebar>
    </div>
  );
};

export default ChannelDetailView;
