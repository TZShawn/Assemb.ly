import React, { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import TextField from "@mui/material/TextField";
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import date from "date-and-time";
import { getTimePickerToolbarUtilityClass } from "@mui/x-date-pickers/TimePicker/timePickerToolbarClasses";
import internal from "stream";
import {
  CartesianGrid,
  Legend,
  LineChart,
  Pie,
  Line,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";

interface IDashboard {
  isLoggedIn: boolean;
  setIsLoggedIn: any;
}

interface IHTTPResponse {
  Missing: string;
  Pass: boolean;
  Date: number;
  Img: string;
}

interface ILineData {
  time: number;
  fail: number;
}

const tempdata: IHTTPResponse[] = [];

const DashBoard: React.FC<IDashboard> = ({ isLoggedIn, setIsLoggedIn }) => {
  const [goodData, setGoodData] = useState<IHTTPResponse[]>([]);
  const [badData, setBadData] = useState<IHTTPResponse[]>([]);
  const [date, setDate] = useState<Dayjs>(
    dayjs().set("hour", 0).set("minute", 0).set("second", 0)
  );

  useEffect(() => {
    fetch("http://localhost:8000/get_good/")
      .then((response) => response.json())
      .then((data) => setGoodData(data));
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/get_bad/")
      .then((response) => {
          response.json().then((data) => setBadData(data));
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  var parsedBadData: {
    Missing: string[];
    Pass: boolean;
    Date: number;
    Img: string;
  }[] = [];
  for (let i = 0; i < badData.length; ++i) {
    var splitArr = badData[i].Missing.split(",");
    parsedBadData.push({
      Missing: splitArr,
      Date: Math.floor(badData[i].Date),
      Img: badData[i].Img,
      Pass: badData[i].Pass,
    });
  }

  var parsedGoodData: {
    Missing: string[];
    Pass: boolean;
    Date: number;
    Img: string;
  }[] = [];
  for (let i = 0; i < goodData.length; ++i) {
    var splitArr = goodData[i].Missing.split(",");
    parsedGoodData.push({
      Missing: splitArr,
      Date: Math.floor(goodData[i].Date),
      Img: goodData[i].Img,
      Pass: goodData[i].Pass,
    });
  }

  let unixDate;

  unixDate = Math.floor(date.valueOf() / 1000);

  const filteredGood = [];

  for (let i = 0; i < parsedGoodData.length; ++i) {
    if (
      parsedGoodData[i].Date >= unixDate &&
      parsedGoodData[i].Date < unixDate + 86399
    ) {
      filteredGood.push(parsedGoodData[i]);
    }
  }

  const filteredBad: {
    Missing: string[];
    Pass: boolean;
    Date: number;
    Img: string;
  }[] = [];

  for (let i = 0; i < parsedBadData.length; ++i) {
    if (
      parsedBadData[i].Date >= unixDate &&
      parsedBadData[i].Date < unixDate + 86399
    ) {
      filteredBad.push(parsedBadData[i]);
    }
  }

  let lineData: ILineData[] = [];

  for (let i = 0; i < 24; ++i) {
    let fails = 0;
    for (let j = 0; j < badData.length; ++j) {
      if (
        badData[j]?.Date >= unixDate &&
        badData[j]?.Date < unixDate + 3600 &&
        badData[j].Pass == false
      ) {
        fails++;
      }
    }
    var newDate = new Date(unixDate * 1000);
    lineData.push({ time: newDate.getHours(), fail: fails });
    unixDate += 3600;
  }

  function compare(a: any, b: any) {
    if (a.time < b.time) {
      return -1;
    }
    if (a.time > b.time) {
      return 1;
    }
    return 0;
  }

  lineData.sort(compare);

  ///////////GETTING DATA FOR PIE GRAPH////////f/////////
  var allMissing: string[] = [];
  console.log(filteredBad)
  for (let i = 0; i < filteredBad.length; ++i) {
    for (let j = 0; j < filteredBad[i].Missing.length; ++j) {
      allMissing.push(filteredBad[i].Missing[j]);
    }
  }

  var parts: string[] = [];
  for (let i = 0; i < allMissing.length; ++i) {
    if (!parts.includes(allMissing[i])) {
      parts.push(allMissing[i]);
    }
  }

  var pieData: { name: string; value: number }[] = [];

  for (let i = 0; i < parts.length; ++i) {
    let num = 0;
    for (let j = 0; j < allMissing.length; ++j) {
      if (parts[i] == allMissing[j]) {
        num++;
      }
    }
    pieData.push({ name: parts[i], value: num });
  }

  return (
    <div className="h-[90vh] flex-col">
      <div className="h-[80%] mt-2">
        <div className="mx-8">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Select date"
              value={date}
              onChange={(newValue) => {
                if (newValue) {
                  setDate(
                    newValue.set("hour", 0).set("minute", 0).set("second", 0)
                  );
                }
              }}
              renderInput={(params) => <TextField {...params} />}
            />
          </LocalizationProvider>
        </div>
        <div className="grid h-1/2 grid-cols-3 gap-4 my-8 mx-8">
          <div className="col-span-2 border border-grey-300">
            <div className="font-bold text-lg p-2">
              Number of fails per hour
            </div>
            <LineChart
              width={1200}
              height={300}
              data={lineData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="fail"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </div>
          <div className="col-span-1 border border-grey-300">
            <div className="font-bold text-lg p-2">
              Number of each component missing
            </div>
            <div className="px-48 py-4">
              <PieChart width={230} height={230}>
                <Pie
                  dataKey="value"
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                />
                <Tooltip />
              </PieChart>
            </div>
          </div>
        </div>
        <div className="grid h-1/2 grid-cols-2 mx-8 my-4 gap-4">
        <div className="max-h-[40vh] overflow-y-auto col-span-1 border border-grey-300">
            <div className="text-lg font-bold p-2">Boards with all components</div>
            <div>
              {filteredGood.map((elem, key) => {
                return (
                  <a href={elem.Img} className="flex p-2 border border-top-black">
                  <div>{"Passed Board " + key} </div>
                  </a>
                );
              })}
            </div>
          </div>
          <div className="max-h-[40vh] overflow-y-auto col-span-1 border border-grey-300">
            <div className="text-lg font-bold p-2">Boards with missing components</div>
            {filteredBad.map((elem, key) => {
              return (
                <a href={elem.Img} className="flex p-2 border border-top-black">
                  <div>{"Failed Board " + key} </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashBoard;
