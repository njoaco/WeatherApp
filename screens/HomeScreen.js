import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, Image, TextInput, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { theme } from '../theme';
import { CalendarDaysIcon, MagnifyingGlassIcon } from 'react-native-heroicons/outline'
import { MapPinIcon } from 'react-native-heroicons/solid';
import { useCallback, useEffect, useState } from 'react';
import { debounce } from 'lodash';
import { fetchLocations, fetchWeatherForecast } from '../backend/weatherAPI';
import { weatherImages } from '../backend';
import * as Progress from 'react-native-progress';
import { storeData } from '../utils/asyncStorage';

export default function HomeScreen() {
    const [showSearch, toggleSearch] = useState(false);
    const [locations, setLocations] = useState ([]);
    const [weather, setWeather] = useState({});
    const [loading, setLoading] = useState(true);

    const handleLocation = (loc) =>{
        console.log('location: ', loc);
        setLocations([]);
        toggleSearch(false);
        setLoading(true);
        fetchWeatherForecast({
            cityName: loc.name,
            days: '7'
        }).then(data=>{
            setWeather(data);
            setLoading(false);
            storeData('city', loc.name);
            //console.log('got forecast: ', data);
        })
    }

    const handleSearch = value=>{
        //console.log('value: ', value);
        if(value.length>2){
            fetchLocations({cityName: value}).then(data=>{
                setLocations(data);
            })
        }
    }
    
    useEffect(()=>{
        fetchMyWeatherData();
    },[])

    const fetchMyWeatherData = async ()=>{
        fetchWeatherForecast({
            cityName: "Buenos Aires",
            days: '7'
        }).then(data=>{
            setWeather(data);
            setLoading(false)
        })
    }

    const handleTextDebounce = useCallback(debounce(handleSearch, 1200), []);

    const {current, location} = weather;

    return (
      <View className="flex-1 relative">
          <StatusBar style='light' />
          <Image blurRadius={70} source={require('../assets/background.png')}
            className="absolute h-full w-full"
          />
          {
            loading? (
                <View className="flex-1 flex-row justify-center items-center">
                    <Text className="text-white text-4xl">
                        <Progress.CircleSnail thickness={10} size={140} color="white" />
                    </Text>
                </View>
            ):(
                <SafeAreaView className="flex flex-1">
                { /* Busqueda */ }
                <View className="mx-4 relative z-50" style={{marginTop: Platform.OS === 'android' ? 25 : 0}}>
                    <View className="flex-row justify-end items-center rounded-full"
                        style={{backgroundColor: showSearch? theme.bgWhite(0.2): 'transparent'}}>
                            {
                                showSearch? (
                                    <TextInput 
                                    onChangeText={handleTextDebounce}
                                    placeholder='Buscar cuidad' 
                                    placeholderTextColor={'lightgray'} 
                                    className="pl-6 h-10 flex-1 text-base text-white"
                                    />
                                ):null
                            }
                            <TouchableOpacity
                            onPress={() => toggleSearch(!showSearch)}
                            style={{backgroundColor: theme.bgWhite(0.3)}}
                            className="rounded-full p-3 m-1"
                            >
                                <MagnifyingGlassIcon size="25" color="white" />
                            </TouchableOpacity>
                        </View>
                        {
                            locations.length>0 && showSearch?(
                                <View className="absolute w-full bg-gray-300 top-16 rounded-3xl">
                                    {
                                        locations.map((loc, index) => {
                                            let showBorder = index+1 != locations.length;
                                            let borderClass = showBorder? 'border-b-2 border-b-gray-500' : '';
                                            return(
                                                <TouchableOpacity
                                                    onPress={() => handleLocation(loc)}
                                                    key={index}
                                                    className={"flex-row items-center border-0 p-3 px-4 mb-1 "+borderClass}
                                                >
                                                    <MapPinIcon size="20" color="gray" />
                                                    <Text className="text-black text-lg ml-2">
                                                        {loc?.name}, {loc?.country}
                                                    </Text>
                                                </TouchableOpacity>
                                            )
                                        })
                                    }
                                </View>
                            ): null
                        }
                </View>
                { /* Pronostico */ }
                <View className="mx-4 flex justify-around flex-1 mb-2">
                    { /* Localización */ }
                    <Text className="text-white text-center text-2xl font-bold">
                        {location?.name}, 
                        <Text className="text-lg font-semibold text-gray-300">
                            {" " + location?.country}
                        </Text>
                    </Text>
                    { /* Imagen del tiempo */ }
                    <View className ="flex-row justify-center">
                        <Image
                            source={weatherImages[current?.condition?.text]}
                            className="w-52 h-52"
                        />
                    </View>
                    { /* Grados Celcius */ }
                    <View className="space-y-2">
                        <Text className="text-center font-bold text-white text-6xl ml-5">
                            {current?.temp_c}&#176;
                        </Text>
                        <Text className="text-center text-white text-xl tracking-widest">
                            {current?.condition?.text}
                        </Text>
                    </View>
                    { /* Otras estadisticas */}
                    <View className="flex-row justify-between mx-4">
                        <View className="flex-row space-x-2 items-center">
                            <Image source={require('../assets/images/windicon.png')} className="h-7 w-7" />
                            <Text className="text-white font-semibold text-base">
                                {current?.wind_kph}km
                            </Text>
                        </View>
                        <View className="flex-row space-x-2 items-center">
                            <Image source={require('../assets/images/humedad.png')} className="h-7 w-7" />
                            <Text className="text-white font-semibold text-base">
                                {current?.humidity}%
                            </Text>
                        </View>
                        <View className="flex-row space-x-2 items-center">
                            <Image source={require('../assets/images/time.png')} className="h-7 w-7" />
                            <Text className="text-white font-semibold text-base">
                              {weather?.forecast?.forecastday[0]?.astro?.sunrise}
                            </Text>
                        </View>
                    </View>
                </View>
    
                { /*Tiempo de los proximas dias*/ }
                <View className="mb-2 space-y-3">
                    <View className="flex-row items-center mx-5 space-x-2">
                        <CalendarDaysIcon size="22" color="white" />
                        <Text className="text-white text-base">
                            Daily forecast
                        </Text>
                    </View>
                    <ScrollView
                    horizontal
                    contentContainerStyle={{paddingHorizontal: 15}}
                    showsHorizontalScrollIndicator={false}
                    >
                        {
                            weather?.forecast?.forecastday?.map((item, index) => {
                                let date = new Date(item.date);
                                let options = {weekday: 'long'};
                                let dayName = date.toLocaleDateString('es-MX', options);
                                dayName = dayName.split(',')[0]
    
                                return(
                                    <View key={index} className="flex justify-center items-center w-24 rounded-3xl py-3 space-y-1 mr-4" style={{backgroundColor: theme.bgWhite(0.15)}}>
                                    <Image source={weatherImages[item?.day?.condition?.text]} className="h-11 w-11" />
                                    <Text className="text-white">{dayName}</Text>
                                    <Text className="text-white text-xl font-semibold">
                                        {item?.day?.avgtemp_c}&#176;
                                    </Text>
                                 </View>
                                )   
                            })
                        }
                    </ScrollView>
                </View>
    
            </SafeAreaView>
            )
          }
      </View>
    );
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
