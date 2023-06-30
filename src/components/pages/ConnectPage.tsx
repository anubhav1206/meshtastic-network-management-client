import React, { FormEventHandler, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { open } from "@tauri-apps/api/shell";
import * as Tabs from "@radix-ui/react-tabs";

import Hero_Image from "@app/assets/onboard_hero_image.jpg";
import Meshtastic_Logo from "@app/assets/Mesh_Logo_Black.png";

import ConnectTab from "@components/connection/ConnectTab";

import { selectConnectionStatus } from "@features/connection/connectionSelectors";
import { connectionSliceActions } from "@features/connection/connectionSlice";
import {
  requestAutoConnectPort,
  requestAvailablePorts,
  requestConnectToDevice,
  requestDisconnectFromAllDevices,
} from "@features/device/deviceActions";
import {
  selectAutoConnectPort,
  selectAvailablePorts,
} from "@features/device/deviceSelectors";
import { requestSliceActions } from "@features/requests/requestReducer";

import { ConnectionType } from "@utils/connections";

import "@components/SplashScreen/SplashScreen.css";
import TcpConnectPane from "../connection/TcpConnectPane";
import SerialConnectPane from "../connection/SerialConnectPane";

const getFullSocketAddress = (address: string, port: string) =>
  `${address}:${port}`;

export interface IOnboardPageProps {
  unmountSelf: () => void;
}

const ConnectPage = ({ unmountSelf }: IOnboardPageProps) => {
  const dispatch = useDispatch();
  const availableSerialPorts = useSelector(selectAvailablePorts());
  const autoConnectPort = useSelector(selectAutoConnectPort());

  // UI state
  const [isScreenActive, setScreenActive] = useState(true);
  const [isAdvancedOpen, setAdvancedOpen] = useState(false);

  // Connection-level state, held here to persist across tab switches
  const [selectedPortName, setSelectedPortName] = useState("");
  const [socketAddress, setSocketAddress] = useState("");
  const [socketPort, setSocketPort] = useState("4403");

  // Advanced serial options, held here to persist across tab switches
  const [baudRate, setBaudRate] = useState(115_200);
  const [dtr, setDtr] = useState(true);
  const [rts, setRts] = useState(false);

  // autoConnectPort takes priority over selectedPortName if it exists
  const activePort = autoConnectPort ?? selectedPortName;

  const activePortState = useSelector(selectConnectionStatus(activePort)) ?? {
    status: "IDLE",
  };

  const activeSocketState = useSelector(
    selectConnectionStatus(getFullSocketAddress(socketAddress, socketPort))
  ) ?? {
    status: "IDLE",
  };

  const requestPorts = () => {
    dispatch(requestAvailablePorts());
  };

  const handleSocketConnect: FormEventHandler = (e) => {
    e.preventDefault();

    dispatch(
      requestConnectToDevice({
        params: {
          type: ConnectionType.TCP,
          socketAddress: getFullSocketAddress(socketAddress, socketPort),
        },
        setPrimary: true,
      })
    );
  };

  const refreshPorts = () => {
    dispatch(
      requestSliceActions.clearRequestState({
        name: requestConnectToDevice.type,
      })
    );
    dispatch(connectionSliceActions.clearAllConnectionState());
    requestPorts();
  };

  const handlePortSelected = (portName: string) => {
    setSelectedPortName(portName);
    dispatch(
      requestConnectToDevice({
        params: { type: ConnectionType.SERIAL, portName, dtr, rts },
        setPrimary: true,
      })
    );
  };

  const openExternalLink = (url: string) => () => {
    void open(url);
  };

  useEffect(() => {
    dispatch(requestDisconnectFromAllDevices());
    dispatch(requestAutoConnectPort());
    requestPorts();
  }, []);

  // Wait to allow user to recognize serial connection succeeded
  useEffect(() => {
    if (
      activePortState.status !== "SUCCESSFUL" &&
      activeSocketState.status !== "SUCCESSFUL"
    )
      return;

    const delayHandle = setTimeout(() => {
      setScreenActive(false);
    }, 600);

    return () => {
      clearTimeout(delayHandle);
    };
  }, [activePortState, activeSocketState]);

  // Move to main page upon successful port connection (need to trigger when port is succesfully connected)
  useEffect(() => {
    if (isScreenActive) return;

    const unmountHandle = setTimeout(() => {
      unmountSelf();
    }, 900);

    return () => {
      clearTimeout(unmountHandle);
    };
  }, [isScreenActive, unmountSelf]);

  return (
    <div
      className="landing-screen-opacity-transition absolute flex flex-row h-screen w-screen z-40 bg-white"
      style={{ opacity: isScreenActive ? 1 : 0 }}
    >
      <div className="flex flex-col flex-1 py-24 overflow-auto no-gutter">
        <div className="flex justify-center">
          <div className="h-1/8">
            <img
              className="w-11/12 h-11/12 text-gray-800"
              src={Meshtastic_Logo}
            ></img>
          </div>
        </div>

        <div className="flex justify-center mt-10">
          <h1 className="text-4xl font-semibold leading-10 text-gray-800">
            Connect a radio
          </h1>
        </div>

        <div className="flex justify-center mt-5">
          <h2 className="text-base leading-6 font-normal text-gray-500 pl-40 pr-40 text-center">
            Connect a supported Meshtastic radio to your computer via USB serial
            or via TCP over Ethernet or WiFi. For more detailed instructions,{" "}
            <button
              type="button"
              onClick={() =>
                void open("https://meshtastic.org/docs/introduction")
              }
              className="hover:cursor-pointer hover:text-gray-600 underline"
            >
              click here
            </button>
            .
          </h2>
        </div>

        <div className="flex justify-center mt-5">
          <Tabs.Root className="w-3/5" defaultValue={ConnectionType.SERIAL}>
            <Tabs.List
              className="flex flex-row"
              aria-label="Choose a connection type"
            >
              <ConnectTab
                label="Serial"
                tooltip="Connect to your radio via a USB serial cable"
                value={ConnectionType.SERIAL}
              />
              <ConnectTab
                label="TCP"
                tooltip="Connect to your radio via Ethernet or WiFi"
                value={ConnectionType.TCP}
              />
            </Tabs.List>

            <Tabs.Content value={ConnectionType.SERIAL}>
              <SerialConnectPane
                availableSerialPorts={availableSerialPorts}
                activePort={activePort}
                activePortState={activePortState}
                handlePortSelected={handlePortSelected}
                refreshPorts={refreshPorts}
                isAdvancedOpen={isAdvancedOpen}
                setAdvancedOpen={setAdvancedOpen}
                baudRate={baudRate}
                setBaudRate={setBaudRate}
                dtr={dtr}
                setDtr={setDtr}
                rts={rts}
                setRts={setRts}
              />
            </Tabs.Content>

            <Tabs.Content value={ConnectionType.TCP}>
              <TcpConnectPane
                socketAddress={socketAddress}
                setSocketAddress={setSocketAddress}
                socketPort={socketPort}
                setSocketPort={setSocketPort}
                activeSocketState={activeSocketState}
                handleSocketConnect={handleSocketConnect}
              />
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>

      <div className="flex-1 relative hidden xl:block">
        <img
          className="w-full h-full object-cover object-center bg-gray-700"
          src={Hero_Image}
        />
        <p className="landing-screen-opacity-transition absolute bottom-3 right-3 text-right text-sm text-gray-600">
          Photo by{" "}
          <button
            className="hover:underline"
            onClick={openExternalLink(
              "https://unsplash.com/@jordansteranka?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
            )}
          >
            Jordan Steranka
          </button>{" "}
          on{" "}
          <button
            className="hover:underline"
            onClick={openExternalLink(
              "https://unsplash.com/photos/snpFW42KR8I?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
            )}
          >
            Unsplash
          </button>
        </p>
      </div>
    </div>
  );
};
export default ConnectPage;