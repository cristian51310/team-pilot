"use client";

import AudioVolumeIndicator from "@/components/ui/AudioVolumeIndicator";
import { ButtonVideoChat, buttonClassName } from "@/components/ui/button";
import FlexibleCallLayout from "@/components/ui/FlexibleCallLayout";
import PermissionPrompt from "@/components/ui/PermissionPrompt";
import RecordingsList from "@/components/ui/RecordingsList";
import useLoadCall from "@/hooks/useLoadCall";
import useStreamCall from "@/hooks/useStreamCall";
import { useUser } from "@clerk/nextjs";
import {
  CallingState,
  DeviceSettings,
  StreamCall,
  StreamTheme,
  VideoPreview,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface MeetingPageProps {
  id: string;
}

export default function MeetingPage({ id }: MeetingPageProps) {
  const { user, isLoaded: userLoaded } = useUser();

  const { call, callLoading } = useLoadCall(id);

  if (!userLoaded || callLoading) {
    return <Loader2 className="mx-auto animate-spin" />;
  }

  if (!call) {
    return <p className="text-center font-bold">Reunión no encontrada</p>;
  }

  const notAllowedToJoin =
    call.type === "private-meeting" &&
    (!user || !call.state.members.find((m) => m.user.id === user.id));

  if (notAllowedToJoin) {
    return (
      <p className="text-center font-bold">No tienes acceso a esta reunión</p>
    );
  }

  return (
    <StreamCall call={call}>
      <StreamTheme>
        <MeetingScreen />
      </StreamTheme>
    </StreamCall>
  );
}

function MeetingScreen() {
  const call = useStreamCall();

  const { useCallEndedAt, useCallStartsAt } = useCallStateHooks();

  const callEndedAt = useCallEndedAt();
  const callStartsAt = useCallStartsAt();

  const [setupComplete, setSetupComplete] = useState(false);

  async function handleSetupComplete() {
    call.join();
    setSetupComplete(true);
  }

  const callIsInFuture = callStartsAt && new Date(callStartsAt) > new Date();

  const callHasEnded = !!callEndedAt;

  if (callHasEnded) {
    return <MeetingEndedScreen />;
  }

  if (callIsInFuture) {
    return <UpcomingMeetingScreen />;
  }

  const description = call.state.custom.description;

  return (
    <div className="space-y-6">
      {description && (
        <p className="text-center">
          Descripción de la reunión:{" "}
          <span className="font-bold">{description}</span>
        </p>
      )}
      {setupComplete ? (
        <CallUI />
      ) : (
        <SetupUI onSetupComplete={handleSetupComplete} />
      )}
    </div>
  );
}

interface SetupUIProps {
  onSetupComplete: () => void;
}

function SetupUI({ onSetupComplete }: SetupUIProps) {
  const call = useStreamCall();

  const { useMicrophoneState, useCameraState } = useCallStateHooks();

  const micState = useMicrophoneState();
  const camState = useCameraState();

  const [micCamDisabled, setMicCamDisabled] = useState(false);

  useEffect(() => {
    if (micCamDisabled) {
      call.camera.disable();
      call.microphone.disable();
    } else {
      call.camera.enable();
      call.microphone.enable();
    }
  }, [micCamDisabled, call]);

  if (!micState.hasBrowserPermission || !camState.hasBrowserPermission) {
    return <PermissionPrompt />;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <h1 className="text-center text-2xl font-bold">Configuración</h1>
      <VideoPreview />
      <div className="flex h-16 items-center gap-3">
        <AudioVolumeIndicator />
        <DeviceSettings />
      </div>
      <label className="flex items-center gap-2 font-medium">
        <input
          type="checkbox"
          checked={micCamDisabled}
          onChange={(e) => setMicCamDisabled(e.target.checked)}
        />
        Unirme con el microfono y camara apagados
      </label>
      <ButtonVideoChat onClick={onSetupComplete}>
        Unirse a la reunión
      </ButtonVideoChat>
    </div>
  );
}

function CallUI() {
  const { useCallCallingState } = useCallStateHooks();

  const callingState = useCallCallingState();

  if (callingState !== CallingState.JOINED) {
    return <Loader2 className="mx-auto animate-spin" />;
  }

  return <FlexibleCallLayout />;
}

function UpcomingMeetingScreen() {
  const call = useStreamCall();

  return (
    <div className="flex flex-col items-center gap-6">
      <p>
        La reunión no ha comenzado aún. Comenzara a las{" "}
        <span className="font-bold">
          {call.state.startsAt?.toLocaleString()}
        </span>
      </p>
      {call.state.custom.description && (
        <p>
          Descripción:{" "}
          <span className="font-bold">{call.state.custom.description}</span>
        </p>
      )}
      <Link href="/calls/" className={buttonClassName}>
        Ir al inicio
      </Link>
    </div>
  );
}

function MeetingEndedScreen() {
  return (
    <div className="flex flex-col items-center gap-6">
      <p className="font-bold">Esta reunión ha terminado</p>
      <Link href="/calls/" className={buttonClassName}>
        Ir al inicio
      </Link>
      <div className="space-y-3">
        <h2 className="text-center text-xl font-bold">Grabaciones</h2>
        <RecordingsList />
      </div>
    </div>
  );
}
