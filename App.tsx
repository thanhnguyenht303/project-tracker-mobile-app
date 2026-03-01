import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { ProjectsProvider, useProjects } from "./src/store/ProjectsContext";

function Bootstrap() {
    const { fetchProjects, loadFavorites, loadRecent } = useProjects();
    useEffect(() => {
      fetchProjects();
      loadFavorites();
      loadRecent();
    }, []);
    return <AppNavigator />;
}

export default function App() {
  return (
    <ProjectsProvider>
      <NavigationContainer>
        <Bootstrap />
      </NavigationContainer>
    </ProjectsProvider>
  );
}
