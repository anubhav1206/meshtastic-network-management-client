import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import maplibregl from "maplibre-gl";
import {
  Layer,
  Map,
  NavigationControl,
  ScaleControl,
  Source,
  ViewStateChangeEvent,
  MapLayerMouseEvent
  } from "react-map-gl";
import { invoke } from "@tauri-apps/api/tauri";
import moment from "moment";

import MapInteractionPane from "@components/Map/MapInteractionPane";
import MapNode from "@components/Map/MapNode";
import NodeSearchDock from "@components/NodeSearch/NodeSearchDock";
import MapSelectedNodeMenu from "@components/Map/MapSelectedNodeMenu";

import Waypoints from "@components/Waypoints/Waypoints";
import WaypointMenu from "@components/Waypoints/WaypointMenu";
import WaypointMenuEdit from "@components/Waypoints/WaypointMenuEdit";

import { requestNewWaypoint } from "@app/features/device/deviceActions";
import type { Waypoint } from "@bindings/protobufs/Waypoint";


import {
  selectActiveNodeId,
  selectAllNodes,
  selectAllWaypoints,
  selectIsWaypointEdit,
  selectActiveWaypoint,
  selectIsNewWaypoint
} from "@features/device/deviceSelectors";
import { deviceSliceActions } from "@features/device/deviceSlice";
import { selectMapState } from "@features/map/mapSelectors";
import { mapSliceActions } from "@features/map/mapSlice";

import "@components/Map/MapView.css";

export const MapView = () => {
  const dispatch = useDispatch();
  const nodes = useSelector(selectAllNodes());
  const activeNodeId = useSelector(selectActiveNodeId());
  const { edgesFeatureCollection, viewState } = useSelector(selectMapState());

  const waypoints = useSelector(selectAllWaypoints());
  const isWaypointEdit = useSelector(selectIsWaypointEdit());
  const activeWaypoint = useSelector(selectActiveWaypoint())
  const newWaypoint = useSelector(selectIsNewWaypoint())

  

  const handleClick = (e: MapLayerMouseEvent ) => {
    // dispatch(deviceSliceActions.setActiveWaypoint(currWaypoint.id));
// 
    if (newWaypoint){

      const min = 100000;
      const max = 999999;
      const rand = min + Math.random() * (max - min);

      const createdWaypoint: Waypoint = {
        id: 0, 
        latitudeI: Math.round(e.lngLat.lat * 1e7),
        longitudeI: Math.round(e.lngLat.lng * 1e7),
        expire: 1708116114, // 2024 2/16
        lockedTo: 0, // Protobuf need updating
        name: "New Waypoint",
        description: "",
        icon: 128529, // -_- emoji
      };

      dispatch(requestNewWaypoint({ waypoint: createdWaypoint, channel: 0 }));
      dispatch(deviceSliceActions.setActiveWaypoint(createdWaypoint.id));
      dispatch(deviceSliceActions.setWaypointEdit(true));
      dispatch(deviceSliceActions.setNewWaypoint(false));
    }

    
  }


  const updateActiveNode = (nodeId: number | null) => {
    if (nodeId === activeNodeId) {
      return dispatch(deviceSliceActions.setActiveNode(null));
    }

    dispatch(deviceSliceActions.setActiveNode(nodeId));
  };

  const handleMoveEnd = (e: ViewStateChangeEvent) => {
    dispatch(
      mapSliceActions.setPosition({
        latitude: e.viewState.latitude,
        longitude: e.viewState.longitude,
      })
    );
  };

  const handleZoomEnd = (e: ViewStateChangeEvent) => {
    dispatch(mapSliceActions.setZoom(e.viewState.zoom));
  };

  useEffect(() => {
    invoke("get_node_edges")
      .then((c) =>
        dispatch(
          mapSliceActions.setEdgesFeatureCollection(
            c as GeoJSON.FeatureCollection
          )
        )
      )
      .catch(() => dispatch(mapSliceActions.setEdgesFeatureCollection(null)));
  }, []);

  return (
    <div className="relative w-full h-full z-0">
      <Map
        initialViewState={viewState}
        mapStyle="https://raw.githubusercontent.com/hc-oss/maplibre-gl-styles/master/styles/osm-mapnik/v8/default.json"
        mapLib={maplibregl}
        attributionControl={false}
        onMoveEnd={handleMoveEnd}
        onZoomEnd={handleZoomEnd}
        onClick={handleClick}
      >

        {/* Controls at bottom right */}
        <ScaleControl maxWidth={144} position="bottom-right" unit="imperial" />
        <NavigationControl position="bottom-right" showCompass={false} />

        {/* Algorithm Visualization */}
        {edgesFeatureCollection && (
          <Source type="geojson" data={edgesFeatureCollection}>
            <Layer
              id="lineLayer"
              type="line"
              source="line-data"
              paint={{
                "line-color": "#6F7986",
                "line-dasharray": [2, 1],
                "line-width": 4,
              }}
            />
          </Source>
        )}

        {/* Visualize all nodes */}
        {nodes
          .filter(
            (n) => !!n.data.position?.latitudeI && !!n.data.position?.longitudeI
          )
          .map((node) => (
            <MapNode
              key={node.data.num}
              onClick={updateActiveNode}
              node={node}
              isBase={false}
              isActive={activeNodeId === node.data.num}
            />
          ))}

        {/* Visualize all waypoints */}
        {waypoints
          .filter(
            (n) =>
              (!!n.latitudeI && !!n.longitudeI) ||      // Shows pins with valid latitudes
              (n.latitudeI == 0 && n.latitudeI == 0)    // Allows for pins at (0, 0)
          )
          .map((eachWaypoint) => (
            <Waypoints key={eachWaypoint.id} currWaypoint={eachWaypoint} />
          ))}

          
        {/* Other popups */}
        {isWaypointEdit ? <WaypointMenuEdit /> : <WaypointMenu />}
        <MapSelectedNodeMenu />
        <NodeSearchDock />
        <MapInteractionPane />
      </Map>
    </div>
  );
};
