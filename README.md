# N.A.ID
## Network Intrusion and Anomaly Detector:
This project uses machine learning to analyze network traffic and classify it as either normal or anomalous, indicationg a potential threat. Threat detected Anomalous network activity, which can indicate port scanning, denail-of-service attempts, or other unauthorized behavior. 

## Threats : </br>
Anomalous network activity, which can indicate port scanning, denial-of-service attempts, or other unauthorized behavior. </br>

### Technology stack </br>
#### Language:
Python </br>
#### Libraries:
Scapy for sniffing and analyzing network packets, scikit-learn for the machine learning model and Pandas for data processing. </br>
### AI Model:
A simple IsolationForest or RandomForestClassifier for anomaly detection. </br>

### Project steps: </br>
#### Collect network data:
Use the Scapy Library to capture packets on your local network interface. For a simple project, you can simulate traffic with tools lien hping3 or use a pre-existing dataset like KDDCup dataset. </br>
### Extract features:
Process the captured packets to extract relevant features for your mode, such as the soruce and destination IP addressses, port numbers, and packet size. </br>
### Train the model:
Using a dataset of both normal and malicious network traffic, train your scikit-learn model to recognize the patterns of n
